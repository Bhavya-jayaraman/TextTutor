package com.texttutor.controller;

import com.texttutor.dto.*;
import com.texttutor.entity.User;
import com.texttutor.service.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getQuizzes(
            @RequestParam(required = false) String category,
            @AuthenticationPrincipal User user) {

        List<QuizDto> quizzes = quizService.getUserQuizzes(user, category);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("quizzes", quizzes);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal User user) {
        QuizStatsDto stats = quizService.getStats(user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("totalQuizzes", stats.getTotalQuizzes());
        response.put("totalAttempts", stats.getTotalAttempts());
        response.put("averageScore", stats.getAverageScore());
        response.put("bestScore", stats.getBestScore());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory(@AuthenticationPrincipal User user) {
        List<QuizAttemptDto> history = quizService.getHistory(user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("history", history);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getQuizById(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {

        QuizDto quiz = quizService.getQuizById(id, user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("quiz", quiz);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateQuiz(
            @RequestBody GenerateStudyMaterialRequest request,
            @AuthenticationPrincipal User user) {

        QuizDto quiz = quizService.generateQuiz(request, user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Generated quiz \"" + quiz.getTitle() + "\" successfully.");
        response.put("quiz", quiz);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitQuiz(
            @PathVariable("id") Long id,
            @RequestBody QuizSubmitRequest submission,
            @AuthenticationPrincipal User user) {

        QuizAttemptDto attempt = quizService.submitQuiz(id, submission, user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Quiz evaluation completed.");
        response.put("attempt", attempt);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {

        quizService.deleteQuiz(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Quiz deleted successfully."));
    }
}
