package com.texttutor.dto;

import java.time.LocalDateTime;

public class FlashcardDto {
    private Long id;
    private Long user_id;
    private Long note_id;
    private String question;
    private String answer;
    private String category;
    private String difficulty;
    private Boolean mastered;
    private String source_reference;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    public FlashcardDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUser_id() { return user_id; }
    public void setUser_id(Long user_id) { this.user_id = user_id; }

    public Long getNote_id() { return note_id; }
    public void setNote_id(Long note_id) { this.note_id = note_id; }

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

    public String getSource_reference() { return source_reference; }
    public void setSource_reference(String source_reference) { this.source_reference = source_reference; }

    public LocalDateTime getCreated_at() { return created_at; }
    public void setCreated_at(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdated_at() { return updated_at; }
    public void setUpdated_at(LocalDateTime updated_at) { this.updated_at = updated_at; }
}
