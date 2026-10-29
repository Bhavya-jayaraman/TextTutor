package com.texttutor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ai_summaries")
public class AISummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "note_id", nullable = false)
    private Long noteId;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String shortSummary;

    @Lob
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String detailedSummary;

    @ElementCollection
    @CollectionTable(name = "summary_bullet_points", joinColumns = @JoinColumn(name = "summary_id"))
    @Column(name = "bullet_point", length = 1000)
    private List<String> bulletPoints = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "summary_keywords", joinColumns = @JoinColumn(name = "summary_id"))
    @Column(name = "keyword", length = 100)
    private List<String> keywords = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AISummary() {}

    public AISummary(User user, Long noteId, String shortSummary, String detailedSummary,
                     List<String> bulletPoints, List<String> keywords) {
        this.user = user;
        this.noteId = noteId;
        this.shortSummary = shortSummary;
        this.detailedSummary = detailedSummary;
        this.bulletPoints = (bulletPoints != null) ? bulletPoints : new ArrayList<>();
        this.keywords = (keywords != null) ? keywords : new ArrayList<>();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public String getShortSummary() { return shortSummary; }
    public void setShortSummary(String shortSummary) { this.shortSummary = shortSummary; }

    public String getDetailedSummary() { return detailedSummary; }
    public void setDetailedSummary(String detailedSummary) { this.detailedSummary = detailedSummary; }

    public List<String> getBulletPoints() { return bulletPoints; }
    public void setBulletPoints(List<String> bulletPoints) { this.bulletPoints = bulletPoints; }

    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
