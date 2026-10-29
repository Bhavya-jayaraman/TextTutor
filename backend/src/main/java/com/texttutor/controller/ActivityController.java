package com.texttutor.controller;

import com.texttutor.dto.ActivityLogDto;
import com.texttutor.entity.User;
import com.texttutor.service.ActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getActivity(@AuthenticationPrincipal User user) {
        List<ActivityLogDto> activities = activityService.getUserActivities(user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("activity", activities);
        return ResponseEntity.ok(response);
    }
}
