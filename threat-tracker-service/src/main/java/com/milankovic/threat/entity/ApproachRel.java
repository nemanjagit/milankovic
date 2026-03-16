package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

@RelationshipProperties
public class ApproachRel {

    @RelationshipId
    private Long id;

    private String date;
    private Double distanceAu;

    @TargetNode
    private Planet planet;

    public ApproachRel() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public Double getDistanceAu() { return distanceAu; }
    public void setDistanceAu(Double distanceAu) { this.distanceAu = distanceAu; }

    public Planet getPlanet() { return planet; }
    public void setPlanet(Planet planet) { this.planet = planet; }
}
