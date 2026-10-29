package com.texttutor.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Set;

public class NoteRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String category = "General";
    private Boolean is_pinned = false;
    private Set<String> tags;

    public NoteRequest() {}

    public NoteRequest(String title, String content, String category, Boolean is_pinned, Set<String> tags) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.is_pinned = is_pinned;
        this.tags = tags;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Boolean getIs_pinned() { return is_pinned; }
    public void setIs_pinned(Boolean is_pinned) { this.is_pinned = is_pinned; }

    public Set<String> getTags() { return tags; }
    public void setTags(Set<String> tags) { this.tags = tags; }
}
