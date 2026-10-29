package com.texttutor.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class ChatRequest {

    @NotBlank(message = "Message cannot be empty")
    private String message;

    private Long conversationId;

    private Long noteId;

    private Long documentId;

    private List<Long> selectedNoteIds;

    public ChatRequest() {}

    public ChatRequest(String message) {
        this(message, null);
    }

    public ChatRequest(String message, Long conversationId) {
        this.message = message;
        this.conversationId = conversationId;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public List<Long> getSelectedNoteIds() { return selectedNoteIds; }
    public void setSelectedNoteIds(List<Long> selectedNoteIds) { this.selectedNoteIds = selectedNoteIds; }
}
