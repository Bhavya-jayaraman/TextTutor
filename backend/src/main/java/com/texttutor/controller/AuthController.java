package com.texttutor.controller;

import com.texttutor.dto.ApiResponse;
import com.texttutor.dto.AuthResponse;
import com.texttutor.dto.LoginRequest;
import com.texttutor.dto.RegisterRequest;
import com.texttutor.dto.UserDto;
import com.texttutor.entity.User;
import com.texttutor.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }
        UserDto dto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(), user.getUpdatedAt());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}
