package com.texttutor.dto;

public class FlashcardStatsDto {
    private long total;
    private long mastered;
    private long learning;
    private int masteryPercentage;

    public FlashcardStatsDto() {}

    public FlashcardStatsDto(long total, long mastered, long learning, int masteryPercentage) {
        this.total = total;
        this.mastered = mastered;
        this.learning = learning;
        this.masteryPercentage = masteryPercentage;
    }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getMastered() { return mastered; }
    public void setMastered(long mastered) { this.mastered = mastered; }

    public long getLearning() { return learning; }
    public void setLearning(long learning) { this.learning = learning; }

    public int getMasteryPercentage() { return masteryPercentage; }
    public void setMasteryPercentage(int masteryPercentage) { this.masteryPercentage = masteryPercentage; }
}
