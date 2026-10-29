package com.texttutor.service;

import com.texttutor.dto.ActivityLogDto;
import com.texttutor.entity.ActivityLog;
import com.texttutor.entity.User;
import com.texttutor.repository.ActivityLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityLogRepository activityLogRepository;

    public ActivityService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDto> getUserActivities(User user) {
        return activityLogRepository.findTop20ByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private ActivityLogDto toDto(ActivityLog log) {
        String action = normalizeAction(log.getType());
        return new ActivityLogDto(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                action,
                log.getDescription(),
                log.getCreatedAt()
        );
    }

    private String normalizeAction(String type) {
        if (type == null) return "note_created";
        switch (type.toUpperCase()) {
            case "NOTE_CREATED": return "note_created";
            case "NOTE_UPDATED": return "note_updated";
            case "AI_SUMMARY": return "summary_generated";
            case "FLASHCARDS_GENERATED": return "flashcards_generated";
            case "QUIZ_COMPLETED": return "quiz_completed";
            case "AI_CHAT": return "ai_chat_used";
            case "STUDY_PLAN_CREATED":
            case "STUDY_PLAN_COMPLETED": return "study_plan";
            default: return type.toLowerCase();
        }
    }
}
