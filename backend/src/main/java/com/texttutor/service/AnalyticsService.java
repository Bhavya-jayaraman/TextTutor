package com.texttutor.service;

import com.texttutor.dto.AnalyticsOverviewDto;
import com.texttutor.entity.*;
import com.texttutor.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final NoteRepository noteRepository;
    private final FlashcardRepository flashcardRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AISummaryRepository aiSummaryRepository;
    private final ConversationRepository conversationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final StudyPlanRepository studyPlanRepository;

    public AnalyticsService(
            NoteRepository noteRepository,
            FlashcardRepository flashcardRepository,
            QuizRepository quizRepository,
            QuizAttemptRepository quizAttemptRepository,
            AISummaryRepository aiSummaryRepository,
            ConversationRepository conversationRepository,
            ActivityLogRepository activityLogRepository,
            StudyPlanRepository studyPlanRepository) {
        this.noteRepository = noteRepository;
        this.flashcardRepository = flashcardRepository;
        this.quizRepository = quizRepository;
        this.quizAttemptRepository = quizAttemptRepository;
        this.aiSummaryRepository = aiSummaryRepository;
        this.conversationRepository = conversationRepository;
        this.activityLogRepository = activityLogRepository;
        this.studyPlanRepository = studyPlanRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsOverviewDto getAnalytics(User user) {
        AnalyticsOverviewDto dto = new AnalyticsOverviewDto();

        // 1. Primary counts
        int totalNotes = (int) noteRepository.countByUser(user);
        int aiSummaries = (int) aiSummaryRepository.countByUser(user);
        int flashcards = (int) flashcardRepository.countByUser(user);
        int masteredCards = (int) flashcardRepository.countByUserAndMasteredTrue(user);
        int quizzes = (int) quizRepository.countByUser(user);
        int quizAttempts = (int) quizAttemptRepository.countByUser(user);
        int aiChatSessions = (int) conversationRepository.countByUser(user);

        dto.setTotalNotes(totalNotes);
        dto.setAiSummariesGenerated(aiSummaries);
        dto.setFlashcardsCreated(flashcards);
        dto.setMasteredCards(masteredCards);
        dto.setQuizzesCompleted(quizzes);
        dto.setQuizAttempts(quizAttempts);
        dto.setAiChatSessions(aiChatSessions);

        // 2. Average score & Retention rate
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserOrderByCompletedAtDesc(user);
        int averageScore = attempts.isEmpty()
                ? 0
                : (int) Math.round(attempts.stream().mapToInt(QuizAttempt::getPercentage).average().orElse(0.0));
        dto.setAverageScore(averageScore);

        int retentionRate = calculateRetentionRate(flashcards, masteredCards, attempts, averageScore);
        dto.setRetentionRate(retentionRate);

        // 3. Study Hours
        List<StudyPlan> plans = studyPlanRepository.findByUserOrderByCreatedAtDesc(user);
        int completedPlansMinutes = plans.stream()
                .filter(p -> Boolean.TRUE.equals(p.getCompleted()))
                .mapToInt(p -> p.getDailyDurationMinutes() != null ? p.getDailyDurationMinutes() : 0)
                .sum();
        double hours = (totalNotes * 0.3) + (quizAttempts * 0.25) + (flashcards * 0.1) + (completedPlansMinutes / 60.0);
        dto.setEstimatedStudyHours(Math.round(hours * 10.0) / 10.0);

        // 4. Study Streak Days
        List<ActivityLog> logs = activityLogRepository.findByUserOrderByCreatedAtDesc(user);
        int streak = calculateStreakDays(logs);
        dto.setStudyStreakDays(streak);

        // 5. Weekly Progress (last 4 calendar weeks)
        List<Note> allNotes = noteRepository.findByUserOrderByCreatedAtDesc(user);
        dto.setWeeklyProgress(calculateWeeklyProgress(allNotes, attempts, retentionRate));

        // 6. Notes & Quizzes Per Day (Current week)
        dto.setNotesPerWeek(calculateDailyNotesPerWeek(allNotes, attempts));

        // 7. Topics Distribution
        dto.setTopicsDistribution(calculateTopicDistribution(allNotes));

        // 8. Study Goals
        dto.setStudyGoals(calculateStudyGoals(masteredCards, totalNotes, averageScore, streak));

        return dto;
    }

    private int calculateRetentionRate(int totalCards, int masteredCards, List<QuizAttempt> attempts, int averageScore) {
        if (totalCards == 0 && attempts.isEmpty()) {
            return 0;
        }
        if (totalCards > 0 && !attempts.isEmpty()) {
            double flashcardRate = ((double) masteredCards / totalCards) * 100.0;
            return (int) Math.round((flashcardRate * 0.5) + (averageScore * 0.5));
        } else if (totalCards > 0) {
            return (int) Math.round(((double) masteredCards / totalCards) * 100.0);
        } else {
            return averageScore;
        }
    }

    private int calculateStreakDays(List<ActivityLog> logs) {
        if (logs == null || logs.isEmpty()) {
            return 0;
        }
        Set<LocalDate> activeDates = logs.stream()
                .map(l -> l.getCreatedAt().toLocalDate())
                .collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        LocalDate cursor = activeDates.contains(today) ? today : today.minusDays(1);

        if (!activeDates.contains(cursor)) {
            return 0;
        }

        int streak = 0;
        while (activeDates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private List<AnalyticsOverviewDto.WeeklyProgressItem> calculateWeeklyProgress(
            List<Note> notes, List<QuizAttempt> attempts, int currentRetention) {
        List<AnalyticsOverviewDto.WeeklyProgressItem> result = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 3; i >= 0; i--) {
            LocalDate weekStart = now.minusWeeks(i).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            LocalDate weekEnd = weekStart.plusDays(6);

            long notesInWeek = notes.stream()
                    .filter(n -> {
                        LocalDate d = n.getCreatedAt().toLocalDate();
                        return !d.isBefore(weekStart) && !d.isAfter(weekEnd);
                    })
                    .count();

            long attemptsInWeek = attempts.stream()
                    .filter(a -> {
                        LocalDate d = a.getCompletedAt().toLocalDate();
                        return !d.isBefore(weekStart) && !d.isAfter(weekEnd);
                    })
                    .count();

            double weekHours = Math.round(((notesInWeek * 0.4) + (attemptsInWeek * 0.3)) * 10.0) / 10.0;
            int retention = (i == 0) ? currentRetention : Math.max(0, currentRetention - (i * 5));

            String label = "W" + (4 - i);
            result.add(new AnalyticsOverviewDto.WeeklyProgressItem(label, weekHours, retention, (int) notesInWeek));
        }
        return result;
    }

    private List<AnalyticsOverviewDto.DailyNotesItem> calculateDailyNotesPerWeek(
            List<Note> notes, List<QuizAttempt> attempts) {
        List<AnalyticsOverviewDto.DailyNotesItem> list = new ArrayList<>();
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        String[] days = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };

        for (int d = 0; d < 7; d++) {
            LocalDate currentDay = monday.plusDays(d);

            long noteCount = notes.stream()
                    .filter(n -> n.getCreatedAt().toLocalDate().isEqual(currentDay))
                    .count();

            long quizCount = attempts.stream()
                    .filter(a -> a.getCompletedAt().toLocalDate().isEqual(currentDay))
                    .count();

            list.add(new AnalyticsOverviewDto.DailyNotesItem(days[d], (int) noteCount, (int) quizCount));
        }
        return list;
    }

    private List<AnalyticsOverviewDto.TopicDistributionItem> calculateTopicDistribution(List<Note> notes) {
        if (notes == null || notes.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, Long> freq = notes.stream()
                .collect(Collectors.groupingBy(
                        n -> (n.getCategory() != null && !n.getCategory().isBlank()) ? n.getCategory() : "General",
                        Collectors.counting()
                ));

        String[] palette = { "#818cf8", "#38bdf8", "#34d399", "#f472b6", "#fbbf24", "#a78bfa", "#f87171" };
        int colorIdx = 0;
        int total = notes.size();

        List<AnalyticsOverviewDto.TopicDistributionItem> items = new ArrayList<>();
        for (Map.Entry<String, Long> entry : freq.entrySet()) {
            int count = entry.getValue().intValue();
            int pct = (int) Math.round(((double) count / total) * 100.0);
            String color = palette[colorIdx % palette.length];
            colorIdx++;

            items.add(new AnalyticsOverviewDto.TopicDistributionItem(entry.getKey(), count, pct, color));
        }
        return items;
    }

    private List<AnalyticsOverviewDto.StudyGoalItem> calculateStudyGoals(
            int masteredCards, int totalNotes, int avgScore, int streak) {
        List<AnalyticsOverviewDto.StudyGoalItem> goals = new ArrayList<>();

        goals.add(new AnalyticsOverviewDto.StudyGoalItem(
                "g1",
                "Master 20 Flashcards",
                20,
                masteredCards,
                "cards",
                Math.min(100, (int) Math.round(((double) masteredCards / 20.0) * 100.0))
        ));

        goals.add(new AnalyticsOverviewDto.StudyGoalItem(
                "g2",
                "Write 5 Study Notes",
                5,
                totalNotes,
                "notes",
                Math.min(100, (int) Math.round(((double) totalNotes / 5.0) * 100.0))
        ));

        goals.add(new AnalyticsOverviewDto.StudyGoalItem(
                "g3",
                "Achieve 80% Quiz Average",
                80,
                avgScore,
                "%",
                Math.min(100, (int) Math.round(((double) avgScore / 80.0) * 100.0))
        ));

        goals.add(new AnalyticsOverviewDto.StudyGoalItem(
                "g4",
                "7-Day Active Streak",
                7,
                streak,
                "days",
                Math.min(100, (int) Math.round(((double) streak / 7.0) * 100.0))
        ));

        return goals;
    }
}
