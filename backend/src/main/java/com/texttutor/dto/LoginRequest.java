package com.texttutor.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private Boolean rememberMe = false;

    public LoginRequest() {}

    public LoginRequest(String email, String password, Boolean rememberMe) {
        this.email = email;
        this.password = password;
        this.rememberMe = rememberMe;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getRememberMe() { return rememberMe; }
    public void setRememberMe(Boolean rememberMe) { this.rememberMe = rememberMe; }
}
