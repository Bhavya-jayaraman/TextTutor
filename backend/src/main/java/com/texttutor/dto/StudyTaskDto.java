package com.texttutor.dto;

public class StudyTaskDto {

    private String id;
    private String title;
    private String time;
    private Boolean completed = false;
    private String priority = "Medium";

    public StudyTaskDto() {}

    public StudyTaskDto(String id, String title, String time, Boolean completed, String priority) {
        this.id = id;
        this.title = title;
        this.time = time;
        this.completed = completed != null ? completed : false;
        this.priority = priority != null ? priority : "Medium";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
}
