package com.texttutor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class ChatMessageDto {

    private Long id;

    @JsonProperty("conversation_id")
    private Long conversationId;

    private String role;
    private String content;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public ChatMessageDto() {}

    public ChatMessageDto(Long id, Long conversationId, String role, String content, LocalDateTime createdAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.role = role;
        this.content = content;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
