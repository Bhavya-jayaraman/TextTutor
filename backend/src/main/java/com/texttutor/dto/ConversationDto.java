package com.texttutor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class ConversationDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    private String title;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    private int messageCount;

    public ConversationDto() {}

    public ConversationDto(Long id, Long userId, String title, LocalDateTime createdAt, LocalDateTime updatedAt, int messageCount) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.messageCount = messageCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public int getMessageCount() { return messageCount; }
    public void setMessageCount(int messageCount) { this.messageCount = messageCount; }
}
