package com.texttutor.dto;

import java.util.Map;

public class QuizSubmitRequest {
    private Map<String, String> answers;

    public QuizSubmitRequest() {}

    public QuizSubmitRequest(Map<String, String> answers) {
        this.answers = answers;
    }

    public Map<String, String> getAnswers() { return answers; }
    public void setAnswers(Map<String, String> answers) { this.answers = answers; }
}
