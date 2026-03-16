package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.*;

import java.util.ArrayList;
import java.util.List;

@Node("Mission")
public class Mission {

    @Id
    private String id;

    private String name;
    private String date;
    private String status;
    private Double costUsd;

    @Relationship(type = "USED", direction = Relationship.Direction.OUTGOING)
    private Rocket rocket;

    @Relationship(type = "TARGETED", direction = Relationship.Direction.OUTGOING)
    private List<MissionTarget> targets = new ArrayList<>();

    public Mission() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getCostUsd() { return costUsd; }
    public void setCostUsd(Double costUsd) { this.costUsd = costUsd; }

    public Rocket getRocket() { return rocket; }
    public void setRocket(Rocket rocket) { this.rocket = rocket; }

    public List<MissionTarget> getTargets() { return targets; }
    public void setTargets(List<MissionTarget> targets) { this.targets = targets; }
}
