package com.texttutor.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.texttutor.dto.StudyPlanDto;
import com.texttutor.dto.StudyPlanRequest;
import com.texttutor.dto.StudyTaskDto;
import com.texttutor.entity.ActivityLog;
import com.texttutor.entity.StudyPlan;
import com.texttutor.entity.User;
import com.texttutor.exception.ResourceNotFoundException;
import com.texttutor.repository.ActivityLogRepository;
import com.texttutor.repository.StudyPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudyPlanService {

    private final StudyPlanRepository studyPlanRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    public StudyPlanService(
            StudyPlanRepository studyPlanRepository,
            ActivityLogRepository activityLogRepository,
            ObjectMapper objectMapper) {
        this.studyPlanRepository = studyPlanRepository;
        this.activityLogRepository = activityLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<StudyPlanDto> getUserPlans(User user) {
        return studyPlanRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudyPlanDto getPlan(User user, Long id) {
        StudyPlan plan = studyPlanRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study plan not found with id: " + id));
        return toDto(plan);
    }

    @Transactional
    public StudyPlanDto createPlan(User user, StudyPlanRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Study plan title is required.");
        }

        String tasksJson = serializeTasks(request.getTasks());

        StudyPlan plan = new StudyPlan(
                user,
                request.getTitle().trim(),
                request.getCategory(),
                request.getStartDate(),
                request.getEndDate(),
                request.getDailyGoal(),
                request.getDailyDurationMinutes(),
                request.getPriority(),
                tasksJson
        );
        if (request.getCompleted() != null) {
            plan.setCompleted(request.getCompleted());
        }

        StudyPlan saved = studyPlanRepository.save(plan);

        try {
            activityLogRepository.save(new ActivityLog(user, "STUDY_PLAN_CREATED", "Created study plan: " + saved.getTitle()));
        } catch (Exception ignored) {}

        return toDto(saved);
    }

    @Transactional
    public StudyPlanDto updatePlan(User user, Long id, StudyPlanRequest request) {
        StudyPlan plan = studyPlanRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study plan not found with id: " + id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            plan.setTitle(request.getTitle().trim());
        }
        if (request.getCategory() != null) {
            plan.setCategory(request.getCategory().trim());
        }
        if (request.getStartDate() != null) {
            plan.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            plan.setEndDate(request.getEndDate());
        }
        if (request.getDailyGoal() != null) {
            plan.setDailyGoal(request.getDailyGoal());
        }
        if (request.getDailyDurationMinutes() != null) {
            plan.setDailyDurationMinutes(request.getDailyDurationMinutes());
        }
        if (request.getPriority() != null) {
            plan.setPriority(request.getPriority());
        }
        if (request.getTasks() != null) {
            plan.setTasksJson(serializeTasks(request.getTasks()));
        }

        boolean wasCompleted = Boolean.TRUE.equals(plan.getCompleted());
        if (request.getCompleted() != null) {
            plan.setCompleted(request.getCompleted());
            if (!wasCompleted && Boolean.TRUE.equals(request.getCompleted())) {
                try {
                    activityLogRepository.save(new ActivityLog(user, "STUDY_PLAN_COMPLETED", "Completed study plan: " + plan.getTitle()));
                } catch (Exception ignored) {}
            }
        }

        StudyPlan updated = studyPlanRepository.save(plan);
        return toDto(updated);
    }

    @Transactional
    public StudyPlanDto toggleCompleted(User user, Long id, Boolean completed) {
        StudyPlan plan = studyPlanRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study plan not found with id: " + id));

        boolean newCompleted = (completed != null) ? completed : !Boolean.TRUE.equals(plan.getCompleted());
        plan.setCompleted(newCompleted);

        if (newCompleted) {
            try {
                activityLogRepository.save(new ActivityLog(user, "STUDY_PLAN_COMPLETED", "Completed study plan: " + plan.getTitle()));
            } catch (Exception ignored) {}
        }

        StudyPlan saved = studyPlanRepository.save(plan);
        return toDto(saved);
    }

    @Transactional
    public void deletePlan(User user, Long id) {
        StudyPlan plan = studyPlanRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Study plan not found with id: " + id));
        studyPlanRepository.delete(plan);
    }

    private String serializeTasks(List<StudyTaskDto> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(tasks);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<StudyTaskDto> deserializeTasks(String tasksJson) {
        if (tasksJson == null || tasksJson.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(tasksJson, new TypeReference<List<StudyTaskDto>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private StudyPlanDto toDto(StudyPlan plan) {
        List<StudyTaskDto> tasks = deserializeTasks(plan.getTasksJson());
        return new StudyPlanDto(
                plan.getId(),
                plan.getUser() != null ? plan.getUser().getId() : null,
                plan.getTitle(),
                plan.getCategory(),
                plan.getStartDate(),
                plan.getEndDate(),
                plan.getDailyGoal(),
                plan.getDailyDurationMinutes(),
                plan.getPriority(),
                plan.getCompleted(),
                tasks,
                plan.getCreatedAt()
        );
    }
}
