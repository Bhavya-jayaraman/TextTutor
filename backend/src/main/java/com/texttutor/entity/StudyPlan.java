package com.texttutor.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_plans")
public class StudyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 100)
    private String category = "General";

    @Column(name = "start_date")
    private String startDate;

    @Column(name = "end_date")
    private String endDate;

    @Column(name = "daily_goal", length = 500)
    private String dailyGoal;

    @Column(name = "daily_duration_minutes")
    private Integer dailyDurationMinutes = 60;

    @Column(length = 20)
    private String priority = "Medium";

    @Column(nullable = false)
    private Boolean completed = false;

    @Lob
    @Column(name = "tasks_json", columnDefinition = "LONGTEXT")
    private String tasksJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public StudyPlan() {}

    public StudyPlan(User user, String title, String category, String startDate, String endDate,
                     String dailyGoal, Integer dailyDurationMinutes, String priority, String tasksJson) {
        this.user = user;
        this.title = title;
        this.category = (category != null && !category.isBlank()) ? category : "General";
        this.startDate = startDate;
        this.endDate = endDate;
        this.dailyGoal = dailyGoal;
        this.dailyDurationMinutes = (dailyDurationMinutes != null) ? dailyDurationMinutes : 60;
        this.priority = (priority != null && !priority.isBlank()) ? priority : "Medium";
        this.tasksJson = tasksJson;
        this.completed = false;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public String getTasksJson() { return tasksJson; }
    public void setTasksJson(String tasksJson) { this.tasksJson = tasksJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
