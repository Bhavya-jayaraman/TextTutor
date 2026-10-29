package com.texttutor.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Lob
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @Column(nullable = false, length = 100)
    private String category = "General";

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    @ElementCollection
    @CollectionTable(name = "note_tags", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "tag", length = 100)
    private Set<String> tags = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "note_insights", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "insight", length = 2000)
    private Set<String> insights = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Note() {}

    public Note(User user, String title, String content, String category, Boolean isPinned) {
        this.user = user;
        this.title = title;
        this.content = content;
        this.category = (category != null && !category.isBlank()) ? category : "General";
        this.isPinned = (isPinned != null) ? isPinned : false;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Boolean getIsPinned() { return isPinned; }
    public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }

    public Set<String> getTags() { return tags; }
    public void setTags(Set<String> tags) { this.tags = tags; }

    public Set<String> getInsights() { return insights; }
    public void setInsights(Set<String> insights) { this.insights = insights; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
