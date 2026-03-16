package com.milankovic.alert.service;

import com.milankovic.alert.client.ObserverClient;
import com.milankovic.alert.client.ThreatTrackerClient;
import com.milankovic.alert.entity.Alert;
import com.milankovic.alert.entity.EventLog;
import com.milankovic.alert.entity.Notification;
import com.milankovic.alert.repository.AlertRepository;
import com.milankovic.alert.repository.AlertRuleRepository;
import com.milankovic.alert.repository.EventLogRepository;
import com.milankovic.alert.repository.NotificationRepository;
import feign.FeignException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final NotificationRepository notificationRepository;
    private final EventLogRepository eventLogRepository;
    private final AlertRuleRepository alertRuleRepository;
    private final ThreatTrackerClient threatTrackerClient;
    private final ObserverClient observerClient;

    public AlertService(AlertRepository alertRepository, NotificationRepository notificationRepository,
                        EventLogRepository eventLogRepository, AlertRuleRepository alertRuleRepository,
                        ThreatTrackerClient threatTrackerClient, ObserverClient observerClient) {
        this.alertRepository = alertRepository;
        this.notificationRepository = notificationRepository;
        this.eventLogRepository = eventLogRepository;
        this.alertRuleRepository = alertRuleRepository;
        this.threatTrackerClient = threatTrackerClient;
        this.observerClient = observerClient;
    }

    // --- Scheduled scan every 6 hours ---
    @Scheduled(fixedDelay = 6 * 60 * 60 * 1000)
    @Transactional
    public int runScan() {
        return scan();
    }

    @Transactional
    public int scan() {
        int generated = 0;
        List<String> planets = List.of("Earth", "Mars", "Venus");

        for (String planet : planets) {
            List<Map<String, Object>> threats;
            try {
                threats = threatTrackerClient.scanThreats(planet);
            } catch (FeignException e) {
                logEvent("SCAN_ERROR", "threat-tracker-service", "Failed to scan " + planet + ": " + e.getMessage());
                continue;
            }

            for (Map<String, Object> threat : threats) {
                String bodyId = String.valueOf(threat.getOrDefault("id", threat.getOrDefault("name", "unknown")));
                Object distObj = threat.get("distanceAu");
                double distAu = distObj instanceof Number n ? n.doubleValue() : 0.05;

                if (alertRepository.existsByBodyIdAndPlanetNameAndStatus(bodyId, planet, "OPEN")) continue;

                Alert alert = new Alert();
                alert.setBodyId(bodyId);
                alert.setPlanetName(planet);
                alert.setDistanceAu(distAu);
                alert.setSeverity(calculateSeverity(distAu));
                alert = alertRepository.save(alert);
                generated++;

                // Notify relevant observers via watchlists
                try {
                    List<Map<String, Object>> observers = observerClient.getAllObservers();
                    for (Map<String, Object> observer : observers) {
                        Long observerId = ((Number) observer.get("id")).longValue();
                        sendNotification(alert, observerId);
                    }
                } catch (FeignException e) {
                    logEvent("NOTIFY_ERROR", "observer-service", "Failed to fetch observers: " + e.getMessage());
                }

                logEvent("ALERT_GENERATED", "alert-service", "Alert " + alert.getId() + " for " + bodyId + " → " + planet);
            }
        }

        logEvent("SCAN_COMPLETE", "alert-service", "Generated " + generated + " new alerts");
        return generated;
    }

    public Alert escalate(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new NoSuchElementException("Alert not found: " + alertId));

        Alert.Severity next = switch (alert.getSeverity()) {
            case LOW -> Alert.Severity.MED;
            case MED -> Alert.Severity.HIGH;
            case HIGH -> Alert.Severity.CRITICAL;
            case CRITICAL -> Alert.Severity.CRITICAL;
        };
        alert.setSeverity(next);
        alertRepository.save(alert);

        logEvent("ALERT_ESCALATED", "alert-service", "Alert " + alertId + " escalated to " + next);
        return alert;
    }

    public Map<String, Object> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        Map<String, Long> bySeverity = new HashMap<>();
        for (Object[] row : alertRepository.countBySeverity()) {
            bySeverity.put(row[0].toString(), (Long) row[1]);
        }
        dashboard.put("openAlertsBySeverity", bySeverity);

        Map<String, Long> byPlanet = new LinkedHashMap<>();
        for (Object[] row : alertRepository.mostThreatenedPlanets()) {
            byPlanet.put((String) row[0], (Long) row[1]);
        }
        dashboard.put("mostThreatenedPlanets", byPlanet);

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        dashboard.put("alertsLast30Days", alertRepository.findByCreatedAtAfter(thirtyDaysAgo).size());
        dashboard.put("totalOpenAlerts", alertRepository.findByStatus("OPEN").size());

        return dashboard;
    }

    public List<Alert> getAllAlerts() { return alertRepository.findAll(); }

    public List<Alert> getOpenAlerts() { return alertRepository.findByStatus("OPEN"); }

    private void sendNotification(Alert alert, Long observerId) {
        Notification n = new Notification();
        n.setAlertId(alert.getId());
        n.setObserverId(observerId);
        n.setMessage("ALERT [" + alert.getSeverity() + "]: " + alert.getBodyId() +
                " approaching " + alert.getPlanetName() + " at " + alert.getDistanceAu() + " AU");
        notificationRepository.save(n);
    }

    private Alert.Severity calculateSeverity(double distAu) {
        if (distAu < 0.001) return Alert.Severity.CRITICAL;
        if (distAu < 0.005) return Alert.Severity.HIGH;
        if (distAu < 0.01)  return Alert.Severity.MED;
        return Alert.Severity.LOW;
    }

    private void logEvent(String type, String source, String payload) {
        EventLog log = new EventLog();
        log.setEventType(type);
        log.setSourceService(source);
        log.setPayloadJson(payload);
        log.setTimestamp(Instant.now());
        eventLogRepository.save(log);
    }
}
