package com.texttutor.dto;

import java.util.ArrayList;
import java.util.List;

public class AnalyticsOverviewDto {

    private int totalNotes;
    private int aiSummariesGenerated;
    private int flashcardsCreated;
    private int masteredCards;
    private int quizzesCompleted;
    private int quizAttempts;
    private int averageScore;
    private int aiChatSessions;
    private double estimatedStudyHours;
    private int studyStreakDays;
    private int retentionRate;

    private List<WeeklyProgressItem> weeklyProgress = new ArrayList<>();
    private List<DailyNotesItem> notesPerWeek = new ArrayList<>();
    private List<TopicDistributionItem> topicsDistribution = new ArrayList<>();
    private List<StudyGoalItem> studyGoals = new ArrayList<>();

    public AnalyticsOverviewDto() {}

    public static class WeeklyProgressItem {
        private String week;
        private double hours;
        private int retention;
        private int notesCount;

        public WeeklyProgressItem() {}

        public WeeklyProgressItem(String week, double hours, int retention, int notesCount) {
            this.week = week;
            this.hours = hours;
            this.retention = retention;
            this.notesCount = notesCount;
        }

        public String getWeek() { return week; }
        public void setWeek(String week) { this.week = week; }
        public double getHours() { return hours; }
        public void setHours(double hours) { this.hours = hours; }
        public int getRetention() { return retention; }
        public void setRetention(int retention) { this.retention = retention; }
        public int getNotesCount() { return notesCount; }
        public void setNotesCount(int notesCount) { this.notesCount = notesCount; }
    }

    public static class DailyNotesItem {
        private String day;
        private int notes;
        private int quizzes;

        public DailyNotesItem() {}

        public DailyNotesItem(String day, int notes, int quizzes) {
            this.day = day;
            this.notes = notes;
            this.quizzes = quizzes;
        }

        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }
        public int getNotes() { return notes; }
        public void setNotes(int notes) { this.notes = notes; }
        public int getQuizzes() { return quizzes; }
        public void setQuizzes(int quizzes) { this.quizzes = quizzes; }
    }

    public static class TopicDistributionItem {
        private String name;
        private int count;
        private int percentage;
        private String color;

        public TopicDistributionItem() {}

        public TopicDistributionItem(String name, int count, int percentage, String color) {
            this.name = name;
            this.count = count;
            this.percentage = percentage;
            this.color = color;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
        public int getPercentage() { return percentage; }
        public void setPercentage(int percentage) { this.percentage = percentage; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public static class StudyGoalItem {
        private String id;
        private String title;
        private int target;
        private int current;
        private String unit;
        private int percentage;

        public StudyGoalItem() {}

        public StudyGoalItem(String id, String title, int target, int current, String unit, int percentage) {
            this.id = id;
            this.title = title;
            this.target = target;
            this.current = current;
            this.unit = unit;
            this.percentage = percentage;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public int getTarget() { return target; }
        public void setTarget(int target) { this.target = target; }
        public int getCurrent() { return current; }
        public void setCurrent(int current) { this.current = current; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public int getPercentage() { return percentage; }
        public void setPercentage(int percentage) { this.percentage = percentage; }
    }

    // Getters and Setters for AnalyticsOverviewDto
    public int getTotalNotes() { return totalNotes; }
    public void setTotalNotes(int totalNotes) { this.totalNotes = totalNotes; }

    public int getAiSummariesGenerated() { return aiSummariesGenerated; }
    public void setAiSummariesGenerated(int aiSummariesGenerated) { this.aiSummariesGenerated = aiSummariesGenerated; }

    public int getFlashcardsCreated() { return flashcardsCreated; }
    public void setFlashcardsCreated(int flashcardsCreated) { this.flashcardsCreated = flashcardsCreated; }

    public int getMasteredCards() { return masteredCards; }
    public void setMasteredCards(int masteredCards) { this.masteredCards = masteredCards; }

    public int getQuizzesCompleted() { return quizzesCompleted; }
    public void setQuizzesCompleted(int quizzesCompleted) { this.quizzesCompleted = quizzesCompleted; }

    public int getQuizAttempts() { return quizAttempts; }
    public void setQuizAttempts(int quizAttempts) { this.quizAttempts = quizAttempts; }

    public int getAverageScore() { return averageScore; }
    public void setAverageScore(int averageScore) { this.averageScore = averageScore; }

    public int getAiChatSessions() { return aiChatSessions; }
    public void setAiChatSessions(int aiChatSessions) { this.aiChatSessions = aiChatSessions; }

    public double getEstimatedStudyHours() { return estimatedStudyHours; }
    public void setEstimatedStudyHours(double estimatedStudyHours) { this.estimatedStudyHours = estimatedStudyHours; }

    public int getStudyStreakDays() { return studyStreakDays; }
    public void setStudyStreakDays(int studyStreakDays) { this.studyStreakDays = studyStreakDays; }

    public int getRetentionRate() { return retentionRate; }
    public void setRetentionRate(int retentionRate) { this.retentionRate = retentionRate; }

    public List<WeeklyProgressItem> getWeeklyProgress() { return weeklyProgress; }
    public void setWeeklyProgress(List<WeeklyProgressItem> weeklyProgress) { this.weeklyProgress = weeklyProgress; }

    public List<DailyNotesItem> getNotesPerWeek() { return notesPerWeek; }
    public void setNotesPerWeek(List<DailyNotesItem> notesPerWeek) { this.notesPerWeek = notesPerWeek; }

    public List<TopicDistributionItem> getTopicsDistribution() { return topicsDistribution; }
    public void setTopicsDistribution(List<TopicDistributionItem> topicsDistribution) { this.topicsDistribution = topicsDistribution; }

    public List<StudyGoalItem> getStudyGoals() { return studyGoals; }
    public void setStudyGoals(List<StudyGoalItem> studyGoals) { this.studyGoals = studyGoals; }
}
