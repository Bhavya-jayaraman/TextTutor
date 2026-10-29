package com.texttutor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class StudyPlanDto {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    private String title;
    private String category;

    @JsonProperty("start_date")
    private String startDate;

    @JsonProperty("end_date")
    private String endDate;

    @JsonProperty("daily_goal")
    private String dailyGoal;

    @JsonProperty("daily_duration_minutes")
    private Integer dailyDurationMinutes;

    private String priority;
    private Boolean completed;

    private List<StudyTaskDto> tasks = new ArrayList<>();

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    public StudyPlanDto() {}

    public StudyPlanDto(Long id, Long userId, String title, String category, String startDate,
                        String endDate, String dailyGoal, Integer dailyDurationMinutes,
                        String priority, Boolean completed, List<StudyTaskDto> tasks,
                        LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.category = category;
        this.startDate = startDate;
        this.endDate = endDate;
        this.dailyGoal = dailyGoal;
        this.dailyDurationMinutes = dailyDurationMinutes;
        this.priority = priority;
        this.completed = completed != null ? completed : false;
        this.tasks = tasks != null ? tasks : new ArrayList<>();
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
