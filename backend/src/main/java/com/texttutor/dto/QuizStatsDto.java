package com.texttutor.dto;

public class QuizStatsDto {
    private long totalQuizzes;
    private long totalAttempts;
    private int averageScore;
    private int bestScore;

    public QuizStatsDto() {}

    public QuizStatsDto(long totalQuizzes, long totalAttempts, int averageScore, int bestScore) {
        this.totalQuizzes = totalQuizzes;
        this.totalAttempts = totalAttempts;
        this.averageScore = averageScore;
        this.bestScore = bestScore;
    }

    public long getTotalQuizzes() { return totalQuizzes; }
    public void setTotalQuizzes(long totalQuizzes) { this.totalQuizzes = totalQuizzes; }

    public long getTotalAttempts() { return totalAttempts; }
    public void setTotalAttempts(long totalAttempts) { this.totalAttempts = totalAttempts; }

    public int getAverageScore() { return averageScore; }
    public void setAverageScore(int averageScore) { this.averageScore = averageScore; }

    public int getBestScore() { return bestScore; }
    public void setBestScore(int bestScore) { this.bestScore = bestScore; }
}
