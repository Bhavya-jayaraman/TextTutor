package com.texttutor.dto;

import java.util.ArrayList;
import java.util.List;

public class ConversationDetailResponse {

    private boolean success = true;
    private String message;
    private ConversationDto conversation;
    private List<ChatMessageDto> messages = new ArrayList<>();

    public ConversationDetailResponse() {}

    public ConversationDetailResponse(ConversationDto conversation, List<ChatMessageDto> messages) {
        this.success = true;
        this.conversation = conversation;
        this.messages = (messages != null) ? messages : new ArrayList<>();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public ConversationDto getConversation() { return conversation; }
    public void setConversation(ConversationDto conversation) { this.conversation = conversation; }

    public List<ChatMessageDto> getMessages() { return messages; }
    public void setMessages(List<ChatMessageDto> messages) { this.messages = messages; }
}
