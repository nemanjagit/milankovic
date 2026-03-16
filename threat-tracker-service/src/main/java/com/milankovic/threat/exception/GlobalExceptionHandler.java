package com.milankovic.threat.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ThreatScanException.class)
    public ResponseEntity<Map<String, Object>> handleThreatScan(ThreatScanException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error(502, ex.getMessage(), req.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error(500, ex.getMessage(), req.getRequestURI()));
    }

    private Map<String, Object> error(int status, String message, String path) {
        return Map.of("timestamp", Instant.now().toString(), "status", status, "message", message, "path", path);
    }
}
