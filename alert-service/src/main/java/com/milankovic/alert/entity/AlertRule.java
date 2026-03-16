package com.milankovic.alert.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "alert_rule")
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "observer_id", nullable = false)
    private Long observerId;

    @Column(name = "body_id")
    private String bodyId;

    @Positive
    @Column(name = "max_distance_au")
    private Double maxDistanceAu;

    @Column(name = "min_severity")
    private String minSeverity = "LOW";

    @Column(name = "active")
    private Boolean active = true;

    public AlertRule() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getObserverId() { return observerId; }
    public void setObserverId(Long observerId) { this.observerId = observerId; }

    public String getBodyId() { return bodyId; }
    public void setBodyId(String bodyId) { this.bodyId = bodyId; }

    public Double getMaxDistanceAu() { return maxDistanceAu; }
    public void setMaxDistanceAu(Double maxDistanceAu) { this.maxDistanceAu = maxDistanceAu; }

    public String getMinSeverity() { return minSeverity; }
    public void setMinSeverity(String minSeverity) { this.minSeverity = minSeverity; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
