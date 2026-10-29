package com.texttutor.dto;

import java.time.LocalDateTime;
import java.util.List;

public class QuizDto {
    private Long id;
    private Long user_id;
    private Long note_id;
    private String title;
    private String category;
    private List<QuizQuestionDto> questions;
    private LocalDateTime created_at;

    public QuizDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUser_id() { return user_id; }
    public void setUser_id(Long user_id) { this.user_id = user_id; }

    public Long getNote_id() { return note_id; }
    public void setNote_id(Long note_id) { this.note_id = note_id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<QuizQuestionDto> getQuestions() { return questions; }
    public void setQuestions(List<QuizQuestionDto> questions) { this.questions = questions; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }
}
