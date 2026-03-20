package com.milankovic.gateway.controller;

import com.milankovic.gateway.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    // In-memory user store — sufficient for demo purposes
    private final ConcurrentHashMap<String, UserRecord> users = new ConcurrentHashMap<>();

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
        // Default admin
        users.put("admin", new UserRecord("admin", "admin123", List.of("ROLE_ADMIN", "ROLE_OBSERVER")));
    }

    // Not used — admin account is pre-seeded in the constructor
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
        if (users.containsKey(req.username())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already exists"));
        }
        users.put(req.username(), new UserRecord(req.username(), req.password(), List.of("ROLE_OBSERVER")));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        UserRecord user = users.get(req.username());
        if (user == null || !user.password().equals(req.password())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }
        String token = jwtUtil.generateToken(user.username(), user.roles());
        return ResponseEntity.ok(Map.of("token", token, "roles", user.roles()));
    }

    public record RegisterRequest(@NotBlank String username, @NotBlank String password) {}
    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    private record UserRecord(String username, String password, List<String> roles) {}
}
