package com.texttutor.controller;

import com.texttutor.dto.*;
import com.texttutor.entity.User;
import com.texttutor.service.AISummaryService;
import com.texttutor.service.ConversationService;
import com.texttutor.service.ai.AiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final ConversationService conversationService;
    private final AISummaryService aiSummaryService;
    private final AiService aiService;

    public AiController(
            ConversationService conversationService,
            AISummaryService aiSummaryService,
            AiService aiService) {
        this.conversationService = conversationService;
        this.aiSummaryService = aiSummaryService;
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal User user) {
        ChatResponse response = conversationService.chat(user, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/summarize")
    public ResponseEntity<AISummarizeResponse> summarizeNote(
            @RequestBody AISummarizeRequest request,
            @AuthenticationPrincipal User user) {
        AISummarizeResponse response = aiSummaryService.summarizeNote(user, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summaries/note/{noteId}")
    public ResponseEntity<Map<String, Object>> getSummariesForNote(
            @PathVariable Long noteId,
            @AuthenticationPrincipal User user) {
        List<AISummarizeResponse> summaries = aiSummaryService.getSummariesForNote(user, noteId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("summaries", summaries);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/keyword-explain")
    public ResponseEntity<Map<String, Object>> explainKeyword(
            @RequestBody KeywordExplainRequest request) {
        String keyword = request.getKeyword() != null ? request.getKeyword() : "";
        String contextTitle = request.getContextTitle() != null ? request.getContextTitle() : "";
        String explanation = aiService.explainKeyword(keyword, contextTitle);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("keyword", keyword);
        response.put("explanation", explanation);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify-gemini")
    public ResponseEntity<AiService.GeminiStatusResult> verifyGemini() {
        AiService.GeminiStatusResult status = aiService.verifyGeminiConnection();
        return ResponseEntity.ok(status);
    }

    @PostMapping("/generate-notes")
    public ResponseEntity<Map<String, Object>> generateNotes(@RequestBody Map<String, String> request) {
        String title = request.getOrDefault("title", "Study Material");
        String content = request.getOrDefault("content", "");
        String category = request.getOrDefault("category", "General");
        String notes = aiService.generateStructuredNotes(title, content, category);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("notes", notes);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<AIStatsResponse> getAiStats(@AuthenticationPrincipal User user) {
        AIStatsResponse stats = aiSummaryService.getAiStats(user);
        return ResponseEntity.ok(stats);
    }
}
