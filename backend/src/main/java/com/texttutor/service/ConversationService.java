package com.texttutor.service;

import com.texttutor.dto.*;
import com.texttutor.entity.*;
import com.texttutor.exception.ResourceNotFoundException;
import com.texttutor.repository.*;
import com.texttutor.service.ai.AiService;
import com.texttutor.service.rag.RagRetrievalService;
import com.texttutor.service.rag.RetrievedChunk;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final NoteRepository noteRepository;
    private final ActivityLogRepository activityLogRepository;
    private final AiService aiService;
    private final RagRetrievalService ragRetrievalService;

    public ConversationService(
            ConversationRepository conversationRepository,
            ChatMessageRepository chatMessageRepository,
            NoteRepository noteRepository,
            ActivityLogRepository activityLogRepository,
            AiService aiService,
            RagRetrievalService ragRetrievalService) {
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.noteRepository = noteRepository;
        this.activityLogRepository = activityLogRepository;
        this.aiService = aiService;
        this.ragRetrievalService = ragRetrievalService;
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getUserConversations(User user) {
        return conversationRepository.findByUserOrderByUpdatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationDetailResponse getConversationDetails(User user, Long conversationId) {
        Conversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        List<ChatMessageDto> messages = chatMessageRepository.findByConversationOrderByCreatedAtAsc(conversation).stream()
                .map(this::toMessageDto)
                .collect(Collectors.toList());

        return new ConversationDetailResponse(toDto(conversation), messages);
    }

    @Transactional
    public ConversationDto createConversation(User user, String title) {
        String safeTitle = (title != null && !title.isBlank()) ? title.trim() : "New Study Chat";
        Conversation conversation = new Conversation(user, safeTitle);
        Conversation saved = conversationRepository.save(conversation);
        return toDto(saved);
    }

    @Transactional
    public ConversationDto updateConversationTitle(User user, Long conversationId, String newTitle) {
        Conversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        if (newTitle != null && !newTitle.isBlank()) {
            conversation.setTitle(newTitle.trim());
            conversation.setUpdatedAt(LocalDateTime.now());
            conversation = conversationRepository.save(conversation);
        }
        return toDto(conversation);
    }

    @Transactional
    public void deleteConversation(User user, Long conversationId) {
        Conversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));

        conversationRepository.delete(conversation);
    }

    @Transactional
    public ChatResponse chat(User user, String userMessageText, Long conversationId) {
        ChatRequest req = new ChatRequest(userMessageText, conversationId);
        return chat(user, req);
    }

    @Transactional
    public ChatResponse chat(User user, ChatRequest request) {
        String userMessageText = request.getMessage();
        if (userMessageText == null || userMessageText.isBlank()) {
            throw new IllegalArgumentException("Chat message cannot be blank.");
        }

        Long conversationId = request.getConversationId();
        Conversation conversation;
        if (conversationId != null) {
            conversation = conversationRepository.findByIdAndUser(conversationId, user)
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));
        } else {
            String derivedTitle = generateTitleFromQuestion(userMessageText);
            conversation = new Conversation(user, derivedTitle);
            conversation = conversationRepository.save(conversation);
        }

        // 1. Save User Message
        ChatMessage userMsg = new ChatMessage(conversation, "user", userMessageText.trim());
        userMsg = chatMessageRepository.save(userMsg);

        // 2. Load recent conversation history (last 8 messages)
        List<ChatMessage> existingMessages = chatMessageRepository.findByConversationOrderByCreatedAtAsc(conversation);
        List<AiService.ChatMessageContext> historyContext = existingMessages.stream()
                .map(m -> new AiService.ChatMessageContext(m.getRole(), m.getContent()))
                .collect(Collectors.toList());

        // 3. Collect filtered note IDs if specified
        List<Long> filterNoteIds = new ArrayList<>();
        if (request.getSelectedNoteIds() != null) {
            filterNoteIds.addAll(request.getSelectedNoteIds());
        }
        if (request.getNoteId() != null && !filterNoteIds.contains(request.getNoteId())) {
            filterNoteIds.add(request.getNoteId());
        }

        // 4. Retrieve RAG chunks
        List<RetrievedChunk> retrievedChunks = ragRetrievalService.retrieve(
                user,
                userMessageText,
                filterNoteIds.isEmpty() ? null : filterNoteIds,
                5
        );

        // 5. Load User notes for high-level context
        List<Note> userNotes = noteRepository.findByUserOrderByCreatedAtDesc(user);
        List<AiService.StudyNoteContext> notesContext = userNotes.stream()
                .map(n -> new AiService.StudyNoteContext(
                        n.getId(),
                        n.getTitle(),
                        n.getCategory(),
                        n.getContent(),
                        n.getTags() != null ? new ArrayList<>(n.getTags()) : new ArrayList<>()
                ))
                .collect(Collectors.toList());

        // 6. Generate Context-Aware AI Answer
        AiService.ChatResult result = aiService.answerStudyQuestionWithChunks(
                userMessageText,
                notesContext,
                retrievedChunks,
                historyContext
        );

        // 7. Save Assistant Message
        ChatMessage assistantMsg = new ChatMessage(conversation, "assistant", result.answer());
        assistantMsg = chatMessageRepository.save(assistantMsg);

        // 8. Update conversation timestamp and title if needed
        conversation.setUpdatedAt(LocalDateTime.now());
        if ("New Study Chat".equalsIgnoreCase(conversation.getTitle()) || "Study Chat".equalsIgnoreCase(conversation.getTitle())) {
            conversation.setTitle(generateTitleFromQuestion(userMessageText));
        }
        conversationRepository.save(conversation);

        // 9. Log Activity
        try {
            String snippet = userMessageText.length() > 60 ? userMessageText.substring(0, 57) + "..." : userMessageText;
            activityLogRepository.save(new ActivityLog(user, "AI_CHAT", "Asked study assistant: " + snippet));
        } catch (Exception ignored) {}

        // 10. Format rich sources
        List<SourceMaterialDto> sources = new ArrayList<>();
        if (result.richCitations() != null && !result.richCitations().isEmpty()) {
            for (AiService.SourceCitation cit : result.richCitations()) {
                sources.add(new SourceMaterialDto(
                        cit.noteId(),
                        cit.title(),
                        cit.category(),
                        cit.pageNumber(),
                        cit.sectionHeading(),
                        cit.excerpt()
                ));
            }
        } else if (result.citedSources() != null) {
            for (AiService.StudyNoteContext s : result.citedSources()) {
                sources.add(new SourceMaterialDto(s.id(), s.title(), s.category()));
            }
        }

        return new ChatResponse(
                conversation.getId(),
                toMessageDto(userMsg),
                toMessageDto(assistantMsg),
                sources
        );
    }

    private String generateTitleFromQuestion(String question) {
        if (question == null || question.isBlank()) return "Study Chat";
        String cleaned = question.trim().replaceAll("\\s+", " ");
        if (cleaned.length() <= 40) {
            return cleaned;
        }
        return cleaned.substring(0, 37) + "...";
    }

    private ConversationDto toDto(Conversation c) {
        int count = c.getMessages() != null ? c.getMessages().size() : 0;
        return new ConversationDto(
                c.getId(),
                c.getUser() != null ? c.getUser().getId() : null,
                c.getTitle(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                count
        );
    }

    private ChatMessageDto toMessageDto(ChatMessage m) {
        return new ChatMessageDto(
                m.getId(),
                m.getConversation() != null ? m.getConversation().getId() : null,
                m.getRole(),
                m.getContent(),
                m.getCreatedAt()
        );
    }
}
