package com.texttutor.controller;

import com.texttutor.dto.ApiResponse;
import com.texttutor.dto.StudyPlanDto;
import com.texttutor.dto.StudyPlanRequest;
import com.texttutor.entity.User;
import com.texttutor.service.StudyPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study-plans")
public class StudyPlanController {

    private final StudyPlanService studyPlanService;

    public StudyPlanController(StudyPlanService studyPlanService) {
        this.studyPlanService = studyPlanService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPlans(@AuthenticationPrincipal User user) {
        List<StudyPlanDto> plans = studyPlanService.getUserPlans(user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("plans", plans);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPlan(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {
        StudyPlanDto plan = studyPlanService.getPlan(user, id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("plan", plan);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createPlan(
            @Valid @RequestBody StudyPlanRequest request,
            @AuthenticationPrincipal User user) {
        StudyPlanDto created = studyPlanService.createPlan(user, request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("plan", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePlan(
            @PathVariable("id") Long id,
            @RequestBody StudyPlanRequest request,
            @AuthenticationPrincipal User user) {
        StudyPlanDto updated = studyPlanService.updatePlan(user, id, request);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("plan", updated);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> toggleCompleted(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, Boolean> body,
            @AuthenticationPrincipal User user) {
        Boolean completed = (body != null) ? body.get("completed") : null;
        StudyPlanDto updated = studyPlanService.toggleCompleted(user, id, completed);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("plan", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deletePlan(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal User user) {
        studyPlanService.deletePlan(user, id);
        return ResponseEntity.ok(new ApiResponse(true, "Study plan deleted successfully"));
    }
}
