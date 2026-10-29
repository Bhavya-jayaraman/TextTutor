package com.texttutor.dto;

public class AISummarizeRequest {

    private Long noteId;
    private String noteContent;
    private String title;
    private String category;

    public AISummarizeRequest() {}

    public AISummarizeRequest(Long noteId, String noteContent, String title, String category) {
        this.noteId = noteId;
        this.noteContent = noteContent;
        this.title = title;
        this.category = category;
    }

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public String getNoteContent() { return noteContent; }
    public void setNoteContent(String noteContent) { this.noteContent = noteContent; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
