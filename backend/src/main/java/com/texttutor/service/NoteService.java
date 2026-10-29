package com.texttutor.service;

import com.texttutor.dto.NoteDto;
import com.texttutor.dto.NoteRequest;
import com.texttutor.entity.ActivityLog;
import com.texttutor.entity.DocumentChunk;
import com.texttutor.entity.Note;
import com.texttutor.entity.User;
import com.texttutor.exception.ResourceNotFoundException;
import com.texttutor.repository.ActivityLogRepository;
import com.texttutor.repository.DocumentChunkRepository;
import com.texttutor.repository.NoteRepository;
import com.texttutor.service.document.DocumentChunker;
import com.texttutor.service.ai.AiService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final ActivityLogRepository activityLogRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final DocumentChunker documentChunker;
    private final AiService aiService;

    public NoteService(
            NoteRepository noteRepository,
            ActivityLogRepository activityLogRepository,
            DocumentChunkRepository documentChunkRepository,
            DocumentChunker documentChunker,
            AiService aiService) {
        this.noteRepository = noteRepository;
        this.activityLogRepository = activityLogRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.documentChunker = documentChunker;
        this.aiService = aiService;
    }

    @Transactional(readOnly = true)
    public List<NoteDto> getUserNotes(User user) {
        return getUserNotes(user, null, null, null, null, "date_desc");
    }

    @Transactional(readOnly = true)
    public List<NoteDto> getUserNotes(User user, String query, String category, String tag, Boolean isPinned, String sort) {
        List<Note> notes = noteRepository.findByUserOrderByCreatedAtDesc(user);

        return notes.stream()
                .filter(n -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase().trim();
                        boolean matchesTitle = n.getTitle() != null && n.getTitle().toLowerCase().contains(q);
                        boolean matchesContent = n.getContent() != null && n.getContent().toLowerCase().contains(q);
                        boolean matchesTag = n.getTags() != null && n.getTags().stream().anyMatch(t -> t.toLowerCase().contains(q));
                        if (!matchesTitle && !matchesContent && !matchesTag) {
                            return false;
                        }
                    }
                    if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
                        if (n.getCategory() == null || !n.getCategory().equalsIgnoreCase(category.trim())) {
                            return false;
                        }
                    }
                    if (tag != null && !tag.isBlank()) {
                        if (n.getTags() == null || !n.getTags().contains(tag.trim().toLowerCase())) {
                            return false;
                        }
                    }
                    if (isPinned != null) {
                        boolean pinned = Boolean.TRUE.equals(n.getIsPinned());
                        if (pinned != isPinned) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    int pinComp = Boolean.compare(Boolean.TRUE.equals(b.getIsPinned()), Boolean.TRUE.equals(a.getIsPinned()));
                    if (pinComp != 0 && (isPinned == null)) {
                        return pinComp;
                    }

                    String s = sort != null ? sort.toLowerCase().trim() : "date_desc";
                    return switch (s) {
                        case "date_asc" -> a.getCreatedAt().compareTo(b.getCreatedAt());
                        case "title_asc" -> a.getTitle().compareToIgnoreCase(b.getTitle());
                        case "title_desc" -> b.getTitle().compareToIgnoreCase(a.getTitle());
                        default -> b.getCreatedAt().compareTo(a.getCreatedAt());
                    };
                })
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteDto togglePin(Long id, User user) {
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found or access denied."));
        note.setIsPinned(!Boolean.TRUE.equals(note.getIsPinned()));
        Note updated = noteRepository.save(note);
        return toDto(updated);
    }

    @Transactional
    public NoteDto createFromDocument(String fileName, String extractedText, String category, User user) {
        String title = fileName != null && !fileName.isBlank() ? fileName : "Imported Study Material";
        int dot = title.lastIndexOf('.');
        if (dot > 0) {
            title = title.substring(0, dot);
        }
        title = title.replace('_', ' ').replace('-', ' ');

        String structuredNotes = aiService.generateStructuredNotes(title, extractedText, category);
        String finalContent = (structuredNotes != null && !structuredNotes.isBlank()) ? structuredNotes : extractedText;

        Note note = new Note(
                user,
                title,
                finalContent,
                category != null && !category.isBlank() ? category.trim() : "Study Material",
                false
        );

        Set<String> tags = new HashSet<>();
        tags.add("document");
        if (fileName != null && fileName.contains(".")) {
            tags.add(fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase());
        }
        note.setTags(tags);
        note.setInsights(generateInsights(extractedText));

        Note saved = noteRepository.save(note);

        // Index note chunks
        indexNoteChunks(saved, user);

        activityLogRepository.save(new ActivityLog(user, "document_uploaded", "Processed and saved document \"" + fileName + "\""));
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public NoteDto getNoteById(Long id, User user) {
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found or access denied."));
        return toDto(note);
    }

    @Transactional
    public NoteDto createNote(NoteRequest request, User user) {
        Note note = new Note(
                user,
                request.getTitle().trim(),
                request.getContent().trim(),
                request.getCategory() != null ? request.getCategory().trim() : "General",
                request.getIs_pinned() != null ? request.getIs_pinned() : false
        );

        if (request.getTags() != null) {
            Set<String> cleanTags = request.getTags().stream()
                    .filter(t -> t != null && !t.isBlank())
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());
            note.setTags(cleanTags);
        }

        note.setInsights(generateInsights(note.getContent()));

        Note saved = noteRepository.save(note);

        // Index chunks for RAG retrieval
        indexNoteChunks(saved, user);

        ActivityLog log = new ActivityLog(user, "note_created", "Created study note \"" + saved.getTitle() + "\"");
        activityLogRepository.save(log);

        return toDto(saved);
    }

    @Transactional
    public NoteDto updateNote(Long id, NoteRequest request, User user) {
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found or access denied."));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            note.setTitle(request.getTitle().trim());
        }
        if (request.getContent() != null && !request.getContent().isBlank()) {
            note.setContent(request.getContent().trim());
            note.setInsights(generateInsights(note.getContent()));
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            note.setCategory(request.getCategory().trim());
        }
        if (request.getIs_pinned() != null) {
            note.setIsPinned(request.getIs_pinned());
        }
        if (request.getTags() != null) {
            Set<String> cleanTags = request.getTags().stream()
                    .filter(t -> t != null && !t.isBlank())
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());
            note.setTags(cleanTags);
        }

        Note updated = noteRepository.save(note);

        // Re-index chunks: remove old chunks and re-index updated text
        documentChunkRepository.deleteByNote(updated);
        indexNoteChunks(updated, user);

        return toDto(updated);
    }

    @Transactional
    public void deleteNote(Long id, User user) {
        Note note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found or access denied."));

        // Delete associated chunks
        documentChunkRepository.deleteByNote(note);
        noteRepository.delete(note);
    }

    private void indexNoteChunks(Note note, User user) {
        if (note.getContent() == null || note.getContent().isBlank()) return;

        List<DocumentChunker.ChunkResult> chunkResults = documentChunker.chunkText(
                note.getContent(), note.getTitle(), note.getCategory()
        );

        for (DocumentChunker.ChunkResult cr : chunkResults) {
            DocumentChunk chunk = new DocumentChunk(
                    user,
                    null,
                    note,
                    note.getTitle(),
                    cr.pageNumber(),
                    cr.sectionHeading(),
                    cr.chunkIndex(),
                    cr.content(),
                    cr.tokenKeywords()
            );
            documentChunkRepository.save(chunk);
        }
    }

    public NoteDto toDto(Note note) {
        NoteDto dto = new NoteDto();
        dto.setId(note.getId());
        dto.setUser_id(note.getUser().getId());
        dto.setTitle(note.getTitle());
        dto.setContent(note.getContent());
        dto.setCategory(note.getCategory());
        dto.setIs_pinned(note.getIsPinned());
        dto.setTags(note.getTags() != null ? new HashSet<>(note.getTags()) : Collections.emptySet());
        dto.setInsights(note.getInsights() != null ? new HashSet<>(note.getInsights()) : Collections.emptySet());
        dto.setCreated_at(note.getCreatedAt());
        dto.setUpdated_at(note.getUpdatedAt());
        return dto;
    }

    private Set<String> generateInsights(String content) {
        Set<String> insights = new LinkedHashSet<>();
        if (content == null || content.isBlank()) {
            insights.add("1. Study note saved and indexed.");
            return insights;
        }

        // Clean extra whitespaces/newlines for clean sentence detection
        String cleanText = content.replaceAll("\\s+", " ").trim();
        String[] sentences = cleanText.split("(?<=[.!?])\\s+");
        List<String> valid = new ArrayList<>();

        for (String s : sentences) {
            String trimmed = s.trim();
            // Discard single symbols or headers
            if (trimmed.length() >= 15 && !trimmed.matches("^[\\W\\d_]+$")) {
                // Strictly cap length to 240 chars to never exceed column limits
                if (trimmed.length() > 240) {
                    trimmed = trimmed.substring(0, 237) + "...";
                }
                valid.add(trimmed);
                if (valid.size() >= 3) {
                    break;
                }
            }
        }

        if (valid.size() >= 3) {
            insights.add("1. " + valid.get(0));
            insights.add("2. " + valid.get(1));
            insights.add("3. " + valid.get(2));
        } else if (valid.size() == 2) {
            insights.add("1. " + valid.get(0));
            insights.add("2. " + valid.get(1));
            insights.add("3. Core concept indexed for active recall and revision.");
        } else if (valid.size() == 1) {
            insights.add("1. Key takeaway: " + valid.get(0));
            insights.add("2. Review key formulas, definitions, and examples.");
            insights.add("3. Practice active recall flashcards for long-term retention.");
        } else {
            insights.add("1. Study material processed and indexed.");
            insights.add("2. Core points organized for semantic AI search.");
            insights.add("3. Ready for interactive Q&A and active recall.");
        }
        return insights;
    }
}
