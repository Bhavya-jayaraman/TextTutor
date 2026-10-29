package com.texttutor.dto;

import java.util.ArrayList;
import java.util.List;

public class AISummarizeResponse {

    private boolean success = true;
    private String message;
    private Long id;
    private Long noteId;
    private String shortSummary;
    private String detailedSummary;
    private List<String> bulletPoints = new ArrayList<>();
    private List<String> keywords = new ArrayList<>();

    public AISummarizeResponse() {}

    public AISummarizeResponse(Long id, Long noteId, String shortSummary, String detailedSummary, List<String> bulletPoints, List<String> keywords) {
        this.success = true;
        this.id = id;
        this.noteId = noteId;
        this.shortSummary = shortSummary;
        this.detailedSummary = detailedSummary;
        this.bulletPoints = (bulletPoints != null) ? bulletPoints : new ArrayList<>();
        this.keywords = (keywords != null) ? keywords : new ArrayList<>();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public String getShortSummary() { return shortSummary; }
    public void setShortSummary(String shortSummary) { this.shortSummary = shortSummary; }

    public String getDetailedSummary() { return detailedSummary; }
    public void setDetailedSummary(String detailedSummary) { this.detailedSummary = detailedSummary; }

    public List<String> getBulletPoints() { return bulletPoints; }
    public void setBulletPoints(List<String> bulletPoints) { this.bulletPoints = bulletPoints; }

    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }
}
