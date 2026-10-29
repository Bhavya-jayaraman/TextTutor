package com.texttutor.service;

import com.texttutor.dto.AuthResponse;
import com.texttutor.dto.LoginRequest;
import com.texttutor.dto.RegisterRequest;
import com.texttutor.dto.UserDto;
import com.texttutor.entity.User;
import com.texttutor.exception.UserAlreadyExistsException;
import com.texttutor.repository.UserRepository;
import com.texttutor.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new UserAlreadyExistsException("An account with this email address already exists. Please sign in.");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getName().trim(), request.getEmail().trim().toLowerCase(), hashedPassword);
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getId(), saved.getEmail(), saved.getName(), false);
        UserDto userDto = new UserDto(saved.getId(), saved.getName(), saved.getEmail(), saved.getCreatedAt(), saved.getUpdatedAt());

        return new AuthResponse(true, "Account created successfully!", token, userDto);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        boolean rememberMe = Boolean.TRUE.equals(request.getRememberMe());
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getName(), rememberMe);
        UserDto userDto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(), user.getUpdatedAt());

        return new AuthResponse(true, "Signed in successfully!", token, userDto);
    }
}
