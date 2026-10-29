package com.texttutor.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class QuizAttemptDto {
    private Long id;
    private Long quiz_id;
    private String quiz_title;
    private Integer score;
    private Integer total_questions;
    private Integer percentage;
    private String feedback;
    private LocalDateTime completed_at;
    private List<QuestionResultDetail> details;

    public static class QuestionResultDetail {
        private Long questionId;
        private String question;
        private String selectedAnswer;
        private String correctAnswer;
        private boolean isCorrect;
        private String explanation;

        public QuestionResultDetail() {}

        public QuestionResultDetail(Long questionId, String question, String selectedAnswer, String correctAnswer, boolean isCorrect, String explanation) {
            this.questionId = questionId;
            this.question = question;
            this.selectedAnswer = selectedAnswer;
            this.correctAnswer = correctAnswer;
            this.isCorrect = isCorrect;
            this.explanation = explanation;
        }

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }

        public String getSelectedAnswer() { return selectedAnswer; }
        public void setSelectedAnswer(String selectedAnswer) { this.selectedAnswer = selectedAnswer; }

        public String getCorrectAnswer() { return correctAnswer; }
        public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

        public boolean isCorrect() { return isCorrect; }
        public void setCorrect(boolean correct) { isCorrect = correct; }

        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
    }

    public QuizAttemptDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getQuiz_id() { return quiz_id; }
    public void setQuiz_id(Long quiz_id) { this.quiz_id = quiz_id; }

    public String getQuiz_title() { return quiz_title; }
    public void setQuiz_title(String quiz_title) { this.quiz_title = quiz_title; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getTotal_questions() { return total_questions; }
    public void setTotal_questions(Integer total_questions) { this.total_questions = total_questions; }

    public Integer getPercentage() { return percentage; }
    public void setPercentage(Integer percentage) { this.percentage = percentage; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public LocalDateTime getCompleted_at() { return completed_at; }
    public void setCompleted_at(LocalDateTime completed_at) { this.completed_at = completed_at; }

    public List<QuestionResultDetail> getDetails() { return details; }
    public void setDetails(List<QuestionResultDetail> details) { this.details = details; }
}
