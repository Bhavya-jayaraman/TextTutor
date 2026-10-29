package com.texttutor.controller;

import com.texttutor.dto.*;
import com.texttutor.entity.User;
import com.texttutor.service.ConversationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ResponseEntity<ConversationsListResponse> getConversations(@AuthenticationPrincipal User user) {
        List<ConversationDto> conversations = conversationService.getUserConversations(user);
        return ResponseEntity.ok(new ConversationsListResponse(conversations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDetailResponse> getConversation(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {
        ConversationDetailResponse detail = conversationService.getConversationDetails(user, id);
        return ResponseEntity.ok(detail);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createConversation(
            @RequestBody(required = false) CreateConversationRequest request,
            @AuthenticationPrincipal User user) {
        String title = (request != null) ? request.getTitle() : "New Study Chat";
        ConversationDto created = conversationService.createConversation(user, title);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("conversation", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTitle(
            @PathVariable("id") Long id,
            @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal User user) {
        String newTitle = (request != null) ? request.getTitle() : null;
        ConversationDto updated = conversationService.updateConversationTitle(user, id, newTitle);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("conversation", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteConversation(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {
        conversationService.deleteConversation(user, id);
        return ResponseEntity.ok(new ApiResponse(true, "Conversation deleted successfully"));
    }
}
