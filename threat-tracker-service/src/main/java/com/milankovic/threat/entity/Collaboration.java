package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

@RelationshipProperties
public class Collaboration {

    @RelationshipId
    private String id;

    private String missionName;
    private String year;

    @TargetNode
    private Agency agency;

    public Collaboration() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMissionName() { return missionName; }
    public void setMissionName(String missionName) { this.missionName = missionName; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public Agency getAgency() { return agency; }
    public void setAgency(Agency agency) { this.agency = agency; }
}
