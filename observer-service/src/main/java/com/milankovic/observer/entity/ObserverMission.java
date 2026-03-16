package com.milankovic.observer.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

@Entity
@Table(name = "mission")
public class ObserverMission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "observer_id", nullable = false)
    private Long observerId;

    @NotBlank
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "target_body_id")
    private String targetBodyId;

    @Column(name = "status")
    private String status = "PLANNED";

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public ObserverMission() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getObserverId() { return observerId; }
    public void setObserverId(Long observerId) { this.observerId = observerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTargetBodyId() { return targetBodyId; }
    public void setTargetBodyId(String targetBodyId) { this.targetBodyId = targetBodyId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
