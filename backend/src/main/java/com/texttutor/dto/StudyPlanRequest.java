package com.texttutor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class StudyPlanRequest {

    @NotBlank(message = "Plan title is required")
    private String title;

    private String category = "General";

    @JsonProperty("start_date")
    private String startDate;

    @JsonProperty("end_date")
    private String endDate;

    @JsonProperty("daily_goal")
    private String dailyGoal;

    @JsonProperty("daily_duration_minutes")
    private Integer dailyDurationMinutes = 60;

    private String priority = "Medium";
    private Boolean completed = false;
    private List<StudyTaskDto> tasks;

    public StudyPlanRequest() {}

    public StudyPlanRequest(String title, String category, String startDate, String endDate,
                            String dailyGoal, Integer dailyDurationMinutes, String priority,
                            Boolean completed, List<StudyTaskDto> tasks) {
        this.title = title;
        this.category = (category != null && !category.isBlank()) ? category : "General";
        this.startDate = startDate;
        this.endDate = endDate;
        this.dailyGoal = dailyGoal;
        this.dailyDurationMinutes = dailyDurationMinutes != null ? dailyDurationMinutes : 60;
        this.priority = (priority != null && !priority.isBlank()) ? priority : "Medium";
        this.completed = completed != null ? completed : false;
        this.tasks = tasks;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getDailyGoal() { return dailyGoal; }
    public void setDailyGoal(String dailyGoal) { this.dailyGoal = dailyGoal; }

    public Integer getDailyDurationMinutes() { return dailyDurationMinutes; }
    public void setDailyDurationMinutes(Integer dailyDurationMinutes) { this.dailyDurationMinutes = dailyDurationMinutes; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }

    public List<StudyTaskDto> getTasks() { return tasks; }
    public void setTasks(List<StudyTaskDto> tasks) { this.tasks = tasks; }
}
