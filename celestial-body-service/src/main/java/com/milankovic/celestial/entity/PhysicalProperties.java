package com.milankovic.celestial.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "physical_properties")
public class PhysicalProperties {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "body_id", nullable = false)
    private Body body;

    @Column(name = "gravity")
    private Double gravity;

    @Column(name = "escape_speed")
    private Double escapeSpeed;

    @Column(name = "rotation_period")
    private Double rotationPeriod;

    @Column(name = "axial_tilt")
    private Double axialTilt;

    @Column(name = "surface_pressure")
    private Double surfacePressure;

    public PhysicalProperties() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Body getBody() { return body; }
    public void setBody(Body body) { this.body = body; }

    public Double getGravity() { return gravity; }
    public void setGravity(Double gravity) { this.gravity = gravity; }

    public Double getEscapeSpeed() { return escapeSpeed; }
    public void setEscapeSpeed(Double escapeSpeed) { this.escapeSpeed = escapeSpeed; }

    public Double getRotationPeriod() { return rotationPeriod; }
    public void setRotationPeriod(Double rotationPeriod) { this.rotationPeriod = rotationPeriod; }

    public Double getAxialTilt() { return axialTilt; }
    public void setAxialTilt(Double axialTilt) { this.axialTilt = axialTilt; }

    public Double getSurfacePressure() { return surfacePressure; }
    public void setSurfacePressure(Double surfacePressure) { this.surfacePressure = surfacePressure; }
}