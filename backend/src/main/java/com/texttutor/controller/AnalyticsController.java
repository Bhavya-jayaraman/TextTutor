package com.texttutor.controller;

import com.texttutor.dto.AnalyticsOverviewDto;
import com.texttutor.entity.User;
import com.texttutor.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAnalytics(@AuthenticationPrincipal User user) {
        AnalyticsOverviewDto analytics = analyticsService.getAnalytics(user);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("analytics", analytics);
        return ResponseEntity.ok(response);
    }
}
