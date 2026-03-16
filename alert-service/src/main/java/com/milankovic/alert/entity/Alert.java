package com.milankovic.alert.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "alert")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "body_id")
    private String bodyId;

    @Column(name = "planet_name")
    private String planetName;

    @Column(name = "distance_au")
    private Double distanceAu;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    private Severity severity;

    @Column(name = "status")
    private String status = "OPEN";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public enum Severity { LOW, MED, HIGH, CRITICAL }

    public Alert() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBodyId() { return bodyId; }
    public void setBodyId(String bodyId) { this.bodyId = bodyId; }

    public String getPlanetName() { return planetName; }
    public void setPlanetName(String planetName) { this.planetName = planetName; }

    public Double getDistanceAu() { return distanceAu; }
    public void setDistanceAu(Double distanceAu) { this.distanceAu = distanceAu; }

    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
