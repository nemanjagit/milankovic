package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.*;

@Node("CloseApproach")
public class CloseApproach {

    @Id @GeneratedValue(GeneratedValue.UUIDGenerator.class)
    private String id;

    private String date;
    private Double distanceAu;
    private Double velocityKmS;
    private String uncertainty;
    private String smallBodyId;
    private String planetName;

    public CloseApproach() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public Double getDistanceAu() { return distanceAu; }
    public void setDistanceAu(Double distanceAu) { this.distanceAu = distanceAu; }

    public Double getVelocityKmS() { return velocityKmS; }
    public void setVelocityKmS(Double velocityKmS) { this.velocityKmS = velocityKmS; }

    public String getUncertainty() { return uncertainty; }
    public void setUncertainty(String uncertainty) { this.uncertainty = uncertainty; }

    public String getSmallBodyId() { return smallBodyId; }
    public void setSmallBodyId(String smallBodyId) { this.smallBodyId = smallBodyId; }

    public String getPlanetName() { return planetName; }
    public void setPlanetName(String planetName) { this.planetName = planetName; }
}
