package com.texttutor.dto;

public class GenerateStudyMaterialRequest {
    private Long noteId;
    private String title;
    private String content;
    private String category;
    private Integer count;

    public GenerateStudyMaterialRequest() {}

    public GenerateStudyMaterialRequest(Long noteId, String title, String content, String category, Integer count) {
        this.noteId = noteId;
        this.title = title;
        this.content = content;
        this.category = category;
        this.count = count;
    }

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
}
