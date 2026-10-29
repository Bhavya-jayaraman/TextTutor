package com.texttutor.service;

import com.texttutor.dto.*;
import com.texttutor.entity.AISummary;
import com.texttutor.entity.Note;
import com.texttutor.entity.User;
import com.texttutor.exception.ResourceNotFoundException;
import com.texttutor.repository.AISummaryRepository;
import com.texttutor.repository.ChatMessageRepository;
import com.texttutor.repository.ConversationRepository;
import com.texttutor.repository.NoteRepository;
import com.texttutor.service.ai.AiService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AISummaryService {

    private final AISummaryRepository aiSummaryRepository;
    private final NoteRepository noteRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AiService aiService;

    public AISummaryService(
            AISummaryRepository aiSummaryRepository,
            NoteRepository noteRepository,
            ConversationRepository conversationRepository,
            ChatMessageRepository chatMessageRepository,
            AiService aiService) {
        this.aiSummaryRepository = aiSummaryRepository;
        this.noteRepository = noteRepository;
        this.conversationRepository = conversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.aiService = aiService;
    }

    @Transactional
    public AISummarizeResponse summarizeNote(User user, AISummarizeRequest request) {
        String title = request.getTitle();
        String content = request.getNoteContent();
        String category = request.getCategory();
        Long noteId = request.getNoteId();

        if (noteId != null && (content == null || content.isBlank())) {
            Note note = noteRepository.findByIdAndUser(noteId, user)
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));
            title = note.getTitle();
            content = note.getContent();
            category = note.getCategory();
        }

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Content to summarize cannot be empty.");
        }

        AiService.AiSummaryResult result = aiService.summarizeNote(title, content, category);

        AISummary summary = new AISummary(
                user,
                noteId != null ? noteId : 0L,
                result.shortSummary(),
                result.detailedSummary(),
                result.bulletPoints(),
                result.keywords()
        );

        AISummary saved = aiSummaryRepository.save(summary);

        return new AISummarizeResponse(
                saved.getId(),
                saved.getNoteId(),
                saved.getShortSummary(),
                saved.getDetailedSummary(),
                saved.getBulletPoints(),
                saved.getKeywords()
        );
    }

    @Transactional(readOnly = true)
    public List<AISummarizeResponse> getSummariesForNote(User user, Long noteId) {
        return aiSummaryRepository.findByUserAndNoteIdOrderByCreatedAtDesc(user, noteId).stream()
                .map(s -> new AISummarizeResponse(
                        s.getId(),
                        s.getNoteId(),
                        s.getShortSummary(),
                        s.getDetailedSummary(),
                        s.getBulletPoints(),
                        s.getKeywords()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AIStatsResponse getAiStats(User user) {
        long totalConversations = conversationRepository.countByUser(user);
        long totalSummaries = aiSummaryRepository.countByUser(user);

        long totalMessages = conversationRepository.findByUserOrderByUpdatedAtDesc(user).stream()
                .mapToLong(c -> chatMessageRepository.findByConversationOrderByCreatedAtAsc(c).size())
                .sum();

        return new AIStatsResponse(totalConversations, totalMessages, totalSummaries);
    }
}
