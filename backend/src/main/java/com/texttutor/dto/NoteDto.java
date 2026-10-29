package com.texttutor.dto;

import java.time.LocalDateTime;
import java.util.Set;

public class NoteDto {

    private Long id;
    private Long user_id;
    private String title;
    private String content;
    private String category;
    private Boolean is_pinned;
    private Set<String> tags;
    private Set<String> insights;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    public NoteDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUser_id() { return user_id; }
    public void setUser_id(Long user_id) { this.user_id = user_id; }

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

    public Set<String> getInsights() { return insights; }
    public void setInsights(Set<String> insights) { this.insights = insights; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdated_at() { return updated_at; }
    public void setUpdated_at(LocalDateTime updated_at) { this.updated_at = updated_at; }
}
