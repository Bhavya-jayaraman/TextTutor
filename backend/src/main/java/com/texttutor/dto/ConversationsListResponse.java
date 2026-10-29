package com.texttutor.dto;

import java.util.ArrayList;
import java.util.List;

public class ConversationsListResponse {

    private boolean success = true;
    private String message;
    private List<ConversationDto> conversations = new ArrayList<>();

    public ConversationsListResponse() {}

    public ConversationsListResponse(List<ConversationDto> conversations) {
        this.success = true;
        this.conversations = (conversations != null) ? conversations : new ArrayList<>();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<ConversationDto> getConversations() { return conversations; }
    public void setConversations(List<ConversationDto> conversations) { this.conversations = conversations; }
}
