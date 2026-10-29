package com.texttutor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(nullable = false)
    private Integer percentage;

    @Lob
    @Column(name = "answers_json", columnDefinition = "LONGTEXT")
    private String answersJson;

    @Column(name = "completed_at", nullable = false, updatable = false)
    private LocalDateTime completedAt;

    public QuizAttempt() {}

    public QuizAttempt(User user, Quiz quiz, Integer score, Integer totalQuestions, Integer percentage, String answersJson) {
        this.user = user;
        this.quiz = quiz;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.percentage = percentage;
        this.answersJson = answersJson;
    }

    @PrePersist
    protected void onCreate() {
        this.completedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getPercentage() { return percentage; }
    public void setPercentage(Integer percentage) { this.percentage = percentage; }

    public String getAnswersJson() { return answersJson; }
    public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
