package com.texttutor.dto;

import jakarta.validation.constraints.NotBlank;

public class FlashcardRequest {

    @NotBlank(message = "Question is required")
    private String question;

    @NotBlank(message = "Answer is required")
    private String answer;

    private String category = "General";
    private String difficulty = "Medium";
    private Long noteId;
    private Boolean mastered;

    public FlashcardRequest() {}

    public FlashcardRequest(String question, String answer, String category, String difficulty, Long noteId, Boolean mastered) {
        this.question = question;
        this.answer = answer;
        this.category = category;
        this.difficulty = difficulty;
        this.noteId = noteId;
        this.mastered = mastered;
    }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public Boolean getMastered() { return mastered; }
    public void setMastered(Boolean mastered) { this.mastered = mastered; }
}
