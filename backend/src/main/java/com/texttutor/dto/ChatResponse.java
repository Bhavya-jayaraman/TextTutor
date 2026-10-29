package com.texttutor.dto;

import java.util.ArrayList;
import java.util.List;

public class ChatResponse {

    private boolean success = true;
    private String message;
    private Long conversationId;
    private ChatMessageDto userMessage;
    private ChatMessageDto assistantMessage;
    private List<SourceMaterialDto> sources = new ArrayList<>();

    public ChatResponse() {}

    public ChatResponse(Long conversationId, ChatMessageDto userMessage, ChatMessageDto assistantMessage, List<SourceMaterialDto> sources) {
        this.success = true;
        this.conversationId = conversationId;
        this.userMessage = userMessage;
        this.assistantMessage = assistantMessage;
        this.sources = (sources != null) ? sources : new ArrayList<>();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public ChatMessageDto getUserMessage() { return userMessage; }
    public void setUserMessage(ChatMessageDto userMessage) { this.userMessage = userMessage; }

    public ChatMessageDto getAssistantMessage() { return assistantMessage; }
    public void setAssistantMessage(ChatMessageDto assistantMessage) { this.assistantMessage = assistantMessage; }

    public List<SourceMaterialDto> getSources() { return sources; }
    public void setSources(List<SourceMaterialDto> sources) { this.sources = sources; }
}
