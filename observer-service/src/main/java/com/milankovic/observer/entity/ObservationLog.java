package com.milankovic.observer.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "observation_log")
public class ObservationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "observer_id", nullable = false)
    private Long observerId;

    @Column(name = "body_id")
    private String bodyId;

    @Column(name = "observed_at")
    private Instant observedAt = Instant.now();

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "data_json", columnDefinition = "TEXT")
    private String dataJson;

    public ObservationLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getObserverId() { return observerId; }
    public void setObserverId(Long observerId) { this.observerId = observerId; }

    public String getBodyId() { return bodyId; }
    public void setBodyId(String bodyId) { this.bodyId = bodyId; }

    public Instant getObservedAt() { return observedAt; }
    public void setObservedAt(Instant observedAt) { this.observedAt = observedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getDataJson() { return dataJson; }
    public void setDataJson(String dataJson) { this.dataJson = dataJson; }
}
