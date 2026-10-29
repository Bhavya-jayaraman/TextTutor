package com.texttutor.service;

import com.texttutor.dto.FlashcardDto;
import com.texttutor.dto.FlashcardRequest;
import com.texttutor.dto.FlashcardStatsDto;
import com.texttutor.dto.GenerateStudyMaterialRequest;
import com.texttutor.entity.ActivityLog;
import com.texttutor.entity.Flashcard;
import com.texttutor.entity.Note;
import com.texttutor.entity.User;
import com.texttutor.exception.ResourceNotFoundException;
import com.texttutor.repository.ActivityLogRepository;
import com.texttutor.repository.FlashcardRepository;
import com.texttutor.repository.NoteRepository;
import com.texttutor.service.ai.AiService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final NoteRepository noteRepository;
    private final ActivityLogRepository activityLogRepository;
    private final AiService aiService;

    public FlashcardService(FlashcardRepository flashcardRepository,
                            NoteRepository noteRepository,
                            ActivityLogRepository activityLogRepository,
                            AiService aiService) {
        this.flashcardRepository = flashcardRepository;
        this.noteRepository = noteRepository;
        this.activityLogRepository = activityLogRepository;
        this.aiService = aiService;
    }

    @Transactional(readOnly = true)
    public List<FlashcardDto> getUserFlashcards(User user, Long noteId, String category, String difficulty, Boolean mastered, String search) {
        List<Flashcard> cards = flashcardRepository.findByUserOrderByCreatedAtDesc(user);

        return cards.stream()
                .filter(c -> {
                    if (noteId != null && !Objects.equals(c.getNoteId(), noteId)) {
                        return false;
                    }
                    if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
                        if (c.getCategory() == null || !c.getCategory().equalsIgnoreCase(category.trim())) {
                            return false;
                        }
                    }
                    if (difficulty != null && !difficulty.isBlank() && !"all".equalsIgnoreCase(difficulty)) {
                        if (c.getDifficulty() == null || !c.getDifficulty().equalsIgnoreCase(difficulty.trim())) {
                            return false;
                        }
                    }
                    if (mastered != null && !Objects.equals(c.getMastered(), mastered)) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase().trim();
                        boolean matchesQ = c.getQuestion() != null && c.getQuestion().toLowerCase().contains(q);
                        boolean matchesA = c.getAnswer() != null && c.getAnswer().toLowerCase().contains(q);
                        if (!matchesQ && !matchesA) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FlashcardDto getFlashcardById(Long id, User user) {
        Flashcard card = flashcardRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found or access denied."));
        return toDto(card);
    }

    @Transactional(readOnly = true)
    public FlashcardStatsDto getStats(User user) {
        long total = flashcardRepository.countByUser(user);
        long mastered = flashcardRepository.countByUserAndMasteredTrue(user);
        long learning = Math.max(0, total - mastered);
        int percentage = total > 0 ? (int) Math.round(((double) mastered / total) * 100) : 0;
        return new FlashcardStatsDto(total, mastered, learning, percentage);
    }

    @Transactional
    public FlashcardDto createFlashcard(FlashcardRequest request, User user) {
        Flashcard card = new Flashcard(
                user,
                request.getNoteId(),
                request.getQuestion().trim(),
                request.getAnswer().trim(),
                request.getCategory(),
                request.getDifficulty()
        );
        if (request.getMastered() != null) {
            card.setMastered(request.getMastered());
        }

        Flashcard saved = flashcardRepository.save(card);
        activityLogRepository.save(new ActivityLog(user, "flashcard_created", "Created study flashcard: \"" + truncate(saved.getQuestion(), 40) + "\""));
        return toDto(saved);
    }

    @Transactional
    public FlashcardDto updateFlashcard(Long id, FlashcardRequest request, User user) {
        Flashcard card = flashcardRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found or access denied."));

        if (request.getQuestion() != null && !request.getQuestion().isBlank()) {
            card.setQuestion(request.getQuestion().trim());
        }
        if (request.getAnswer() != null && !request.getAnswer().isBlank()) {
            card.setAnswer(request.getAnswer().trim());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            card.setCategory(request.getCategory().trim());
        }
        if (request.getDifficulty() != null && !request.getDifficulty().isBlank()) {
            card.setDifficulty(request.getDifficulty().trim());
        }
        if (request.getMastered() != null) {
            card.setMastered(request.getMastered());
        }

        Flashcard updated = flashcardRepository.save(card);
        return toDto(updated);
    }

    @Transactional
    public FlashcardDto toggleMastered(Long id, User user, Boolean explicitValue) {
        Flashcard card = flashcardRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found or access denied."));

        boolean newValue = explicitValue != null ? explicitValue : !Boolean.TRUE.equals(card.getMastered());
        card.setMastered(newValue);
        Flashcard updated = flashcardRepository.save(card);

        String act = newValue ? "mastered" : "marked for review";
        activityLogRepository.save(new ActivityLog(user, "flashcard_mastered", "Flashcard " + act + ": \"" + truncate(updated.getQuestion(), 30) + "\""));
        return toDto(updated);
    }

    @Transactional
    public void deleteFlashcard(Long id, User user) {
        Flashcard card = flashcardRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found or access denied."));
        flashcardRepository.delete(card);
    }

    @Transactional
    public List<FlashcardDto> generateFlashcards(GenerateStudyMaterialRequest req, User user) {
        String title = req.getTitle();
        String content = req.getContent();
        String category = req.getCategory();
        Long noteId = req.getNoteId();

        if (noteId != null) {
            Optional<Note> noteOpt = noteRepository.findByIdAndUser(noteId, user);
            if (noteOpt.isPresent()) {
                Note note = noteOpt.get();
                if (title == null || title.isBlank()) title = note.getTitle();
                if (content == null || content.isBlank()) content = note.getContent();
                if (category == null || category.isBlank()) category = note.getCategory();
            }
        }

        if ((content == null || content.isBlank()) && (title == null || title.isBlank())) {
            throw new IllegalArgumentException("Study material title or content is required to generate flashcards.");
        }

        int count = req.getCount() != null ? req.getCount() : 5;
        List<AiService.GeneratedFlashcard> generated = aiService.generateFlashcards(title, content, category, count);

        List<FlashcardDto> savedList = new ArrayList<>();
        for (AiService.GeneratedFlashcard g : generated) {
            Flashcard card = new Flashcard(user, noteId, g.question(), g.answer(), category, g.difficulty(), g.sourceReference());
            Flashcard saved = flashcardRepository.save(card);
            savedList.add(toDto(saved));
        }

        activityLogRepository.save(new ActivityLog(user, "flashcards_generated", "Generated " + savedList.size() + " active recall flashcards for \"" + title + "\""));
        return savedList;
    }

    public FlashcardDto toDto(Flashcard card) {
        FlashcardDto dto = new FlashcardDto();
        dto.setId(card.getId());
        dto.setUser_id(card.getUser().getId());
        dto.setNote_id(card.getNoteId());
        dto.setQuestion(card.getQuestion());
        dto.setAnswer(card.getAnswer());
        dto.setCategory(card.getCategory());
        dto.setDifficulty(card.getDifficulty());
        dto.setMastered(card.getMastered());
        dto.setSource_reference(card.getSourceReference());
        dto.setCreated_at(card.getCreatedAt());
        dto.setUpdated_at(card.getUpdatedAt());
        return dto;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
