package com.texttutor.controller;

import com.texttutor.dto.ApiResponse;
import com.texttutor.dto.FlashcardDto;
import com.texttutor.dto.FlashcardRequest;
import com.texttutor.dto.FlashcardStatsDto;
import com.texttutor.dto.GenerateStudyMaterialRequest;
import com.texttutor.entity.User;
import com.texttutor.service.FlashcardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flashcards")
public class FlashcardController {

    private final FlashcardService flashcardService;

    public FlashcardController(FlashcardService flashcardService) {
        this.flashcardService = flashcardService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFlashcards(
            @RequestParam(required = false) Long noteId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Boolean mastered,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal User user) {

        List<FlashcardDto> cards = flashcardService.getUserFlashcards(user, noteId, category, difficulty, mastered, search);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("flashcards", cards);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal User user) {
        FlashcardStatsDto stats = flashcardService.getStats(user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("total", stats.getTotal());
        response.put("mastered", stats.getMastered());
        response.put("learning", stats.getLearning());
        response.put("masteryPercentage", stats.getMasteryPercentage());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getFlashcardById(@PathVariable("id") Long id, @AuthenticationPrincipal User user) {
        FlashcardDto card = flashcardService.getFlashcardById(id, user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("flashcard", card);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFlashcard(
            @Valid @RequestBody FlashcardRequest request,
            @AuthenticationPrincipal User user) {

        FlashcardDto created = flashcardService.createFlashcard(request, user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Flashcard created successfully.");
        response.put("flashcard", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateFlashcards(
            @RequestBody GenerateStudyMaterialRequest request,
            @AuthenticationPrincipal User user) {

        List<FlashcardDto> generated = flashcardService.generateFlashcards(request, user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Generated " + generated.size() + " flashcards successfully.");
        response.put("flashcards", generated);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateFlashcard(
            @PathVariable("id") Long id,
            @RequestBody FlashcardRequest request,
            @AuthenticationPrincipal User user) {

        FlashcardDto updated = flashcardService.updateFlashcard(id, request, user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Flashcard updated successfully.");
        response.put("flashcard", updated);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/master")
    public ResponseEntity<Map<String, Object>> toggleMaster(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, Boolean> body,
            @AuthenticationPrincipal User user) {

        Boolean explicitValue = (body != null) ? body.get("mastered") : null;
        FlashcardDto updated = flashcardService.toggleMastered(id, user, explicitValue);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Flashcard mastery updated.");
        response.put("flashcard", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFlashcard(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {

        flashcardService.deleteFlashcard(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Flashcard deleted successfully."));
    }
}
