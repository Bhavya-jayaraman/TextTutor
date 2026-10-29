package com.texttutor.dto;

public class AIStatsResponse {

    private boolean success = true;
    private long totalConversations;
    private long totalMessages;
    private long totalSummaries;

    public AIStatsResponse() {}

    public AIStatsResponse(long totalConversations, long totalMessages, long totalSummaries) {
        this.success = true;
        this.totalConversations = totalConversations;
        this.totalMessages = totalMessages;
        this.totalSummaries = totalSummaries;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public long getTotalConversations() { return totalConversations; }
    public void setTotalConversations(long totalConversations) { this.totalConversations = totalConversations; }

    public long getTotalMessages() { return totalMessages; }
    public void setTotalMessages(long totalMessages) { this.totalMessages = totalMessages; }

    public long getTotalSummaries() { return totalSummaries; }
    public void setTotalSummaries(long totalSummaries) { this.totalSummaries = totalSummaries; }
}
