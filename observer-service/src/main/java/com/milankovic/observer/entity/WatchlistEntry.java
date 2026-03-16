package com.milankovic.observer.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

@Entity
@Table(name = "watchlist_entry")
public class WatchlistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "observer_id", nullable = false)
    private Long observerId;

    @NotBlank
    @Column(name = "body_id", nullable = false)
    private String bodyId;

    @Positive
    @Column(name = "alert_threshold_au")
    private Double alertThresholdAu;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public WatchlistEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getObserverId() { return observerId; }
    public void setObserverId(Long observerId) { this.observerId = observerId; }

    public String getBodyId() { return bodyId; }
    public void setBodyId(String bodyId) { this.bodyId = bodyId; }

    public Double getAlertThresholdAu() { return alertThresholdAu; }
    public void setAlertThresholdAu(Double alertThresholdAu) { this.alertThresholdAu = alertThresholdAu; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
