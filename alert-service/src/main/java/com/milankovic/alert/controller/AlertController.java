package com.milankovic.alert.controller;

import com.milankovic.alert.entity.Alert;
import com.milankovic.alert.entity.AlertRule;
import com.milankovic.alert.repository.AlertRuleRepository;
import com.milankovic.alert.service.AlertService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alerts")
public class AlertController {

    private final AlertService alertService;
    private final AlertRuleRepository alertRuleRepository;

    public AlertController(AlertService alertService, AlertRuleRepository alertRuleRepository) {
        this.alertService = alertService;
        this.alertRuleRepository = alertRuleRepository;
    }

    @GetMapping
    public ResponseEntity<List<Alert>> getAll() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    @GetMapping("/open")
    public ResponseEntity<List<Alert>> getOpen() {
        return ResponseEntity.ok(alertService.getOpenAlerts());
    }

    @PostMapping("/scan")
    public ResponseEntity<Map<String, Object>> scan() {
        int count = alertService.scan();
        return ResponseEntity.ok(Map.of("generated", count));
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<Alert> escalate(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.escalate(id));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        return ResponseEntity.ok(alertService.getDashboard());
    }

    @GetMapping("/rules")
    public ResponseEntity<List<AlertRule>> getRules() {
        return ResponseEntity.ok(alertRuleRepository.findAll());
    }

    @PostMapping("/rules")
    public ResponseEntity<AlertRule> createRule(@Valid @RequestBody AlertRule rule) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alertRuleRepository.save(rule));
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        alertRuleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
