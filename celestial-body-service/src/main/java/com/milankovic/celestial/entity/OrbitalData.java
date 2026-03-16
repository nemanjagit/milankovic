package com.milankovic.celestial.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "orbital_data")
public class OrbitalData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "body_id", nullable = false)
    private Body body;

    @Column(name = "semi_major_axis")
    private Double semiMajorAxis;

    @Column(name = "period_days")
    private Double periodDays;

    @Column(name = "eccentricity")
    private Double eccentricity;

    @Column(name = "inclination")
    private Double inclination;

    @Column(name = "velocity_km_s")
    private Double velocityKmS;

    public OrbitalData() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Body getBody() { return body; }
    public void setBody(Body body) { this.body = body; }

    public Double getSemiMajorAxis() { return semiMajorAxis; }
    public void setSemiMajorAxis(Double semiMajorAxis) { this.semiMajorAxis = semiMajorAxis; }

    public Double getPeriodDays() { return periodDays; }
    public void setPeriodDays(Double periodDays) { this.periodDays = periodDays; }

    public Double getEccentricity() { return eccentricity; }
    public void setEccentricity(Double eccentricity) { this.eccentricity = eccentricity; }

    public Double getInclination() { return inclination; }
    public void setInclination(Double inclination) { this.inclination = inclination; }

    public Double getVelocityKmS() { return velocityKmS; }
    public void setVelocityKmS(Double velocityKmS) { this.velocityKmS = velocityKmS; }
}