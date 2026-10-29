package com.texttutor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "flashcards")
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "note_id")
    private Long noteId;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String answer;

    @Column(nullable = false, length = 100)
    private String category = "General";

    @Column(nullable = false, length = 20)
    private String difficulty = "Medium";

    @Column(nullable = false)
    private Boolean mastered = false;

    @Column(name = "source_reference", length = 255)
    private String sourceReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Flashcard() {}

    public Flashcard(User user, Long noteId, String question, String answer, String category, String difficulty) {
        this(user, noteId, question, answer, category, difficulty, null);
    }

    public Flashcard(User user, Long noteId, String question, String answer, String category, String difficulty, String sourceReference) {
        this.user = user;
        this.noteId = noteId;
        this.question = question;
        this.answer = answer;
        this.category = (category != null && !category.isBlank()) ? category : "General";
        this.difficulty = (difficulty != null && !difficulty.isBlank()) ? difficulty : "Medium";
        this.sourceReference = sourceReference;
        this.mastered = false;
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

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public Boolean getMastered() { return mastered; }
    public void setMastered(Boolean mastered) { this.mastered = mastered; }

    public String getSourceReference() { return sourceReference; }
    public void setSourceReference(String sourceReference) { this.sourceReference = sourceReference; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
