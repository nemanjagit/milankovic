package com.milankovic.celestial.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "body")
public class Body {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "name")
    private String name;

    @Column(name = "body_type")
    private String bodyType;

    @Column(name = "mass")
    private Double mass;

    @Column(name = "radius")
    private Double radius;

    @Column(name = "mean_temp")
    private Integer meanTemp;

    @Column(name = "discovered_by")
    private String discoveredBy;

    @OneToOne(mappedBy = "body", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private OrbitalData orbitalData;

    @OneToOne(mappedBy = "body", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private PhysicalProperties physicalProperties;

    @OneToMany(mappedBy = "body", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Moon> moons = new ArrayList<>();

    public Body() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }

    public Double getMass() { return mass; }
    public void setMass(Double mass) { this.mass = mass; }

    public Double getRadius() { return radius; }
    public void setRadius(Double radius) { this.radius = radius; }

    public Integer getMeanTemp() { return meanTemp; }
    public void setMeanTemp(Integer meanTemp) { this.meanTemp = meanTemp; }

    public String getDiscoveredBy() { return discoveredBy; }
    public void setDiscoveredBy(String discoveredBy) { this.discoveredBy = discoveredBy; }

    public OrbitalData getOrbitalData() { return orbitalData; }
    public void setOrbitalData(OrbitalData orbitalData) { this.orbitalData = orbitalData; }

    public PhysicalProperties getPhysicalProperties() { return physicalProperties; }
    public void setPhysicalProperties(PhysicalProperties physicalProperties) { this.physicalProperties = physicalProperties; }

    public List<Moon> getMoons() { return moons; }
    public void setMoons(List<Moon> moons) { this.moons = moons; }
}