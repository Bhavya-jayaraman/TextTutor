package com.texttutor.dto;

import java.util.List;

public class FlashcardsResponse {
    private boolean success;
    private List<FlashcardDto> flashcards;

    public FlashcardsResponse() {}

    public FlashcardsResponse(boolean success, List<FlashcardDto> flashcards) {
        this.success = success;
        this.flashcards = flashcards;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public List<FlashcardDto> getFlashcards() { return flashcards; }
    public void setFlashcards(List<FlashcardDto> flashcards) { this.flashcards = flashcards; }
}
