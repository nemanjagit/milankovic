package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.*;

import java.util.ArrayList;
import java.util.List;

@Node("SmallBody")
public class SmallBody {

    @Id
    private String id;

    private String name;
    private String designation;
    private String bodyType;
    private Double diameterKm;
    private Boolean hazardous;
    private Double absMagnitude;

    @Relationship(type = "APPROACHES", direction = Relationship.Direction.OUTGOING)
    private List<ApproachRel> approaches = new ArrayList<>();

    @Relationship(type = "THREATENS", direction = Relationship.Direction.OUTGOING)
    private List<Planet> threatens = new ArrayList<>();

    @Relationship(type = "BELONGS_TO", direction = Relationship.Direction.OUTGOING)
    private OrbitFamily orbitFamily;

    @Relationship(type = "SHARES_CORRIDOR", direction = Relationship.Direction.OUTGOING)
    private List<SmallBody> sharesCorridor = new ArrayList<>();

    public SmallBody() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }

    public Double getDiameterKm() { return diameterKm; }
    public void setDiameterKm(Double diameterKm) { this.diameterKm = diameterKm; }

    public Boolean getHazardous() { return hazardous; }
    public void setHazardous(Boolean hazardous) { this.hazardous = hazardous; }

    public Double getAbsMagnitude() { return absMagnitude; }
    public void setAbsMagnitude(Double absMagnitude) { this.absMagnitude = absMagnitude; }

    public List<ApproachRel> getApproaches() { return approaches; }
    public void setApproaches(List<ApproachRel> approaches) { this.approaches = approaches; }

    public List<Planet> getThreatens() { return threatens; }
    public void setThreatens(List<Planet> threatens) { this.threatens = threatens; }

    public OrbitFamily getOrbitFamily() { return orbitFamily; }
    public void setOrbitFamily(OrbitFamily orbitFamily) { this.orbitFamily = orbitFamily; }

    public List<SmallBody> getSharesCorridor() { return sharesCorridor; }
    public void setSharesCorridor(List<SmallBody> sharesCorridor) { this.sharesCorridor = sharesCorridor; }
}
