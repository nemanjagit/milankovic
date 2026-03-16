package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

@RelationshipProperties
public class MissionTarget {

    @RelationshipId
    private String id;

    private String missionType;

    @TargetNode
    private SpaceCelestialBody target;

    public MissionTarget() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMissionType() { return missionType; }
    public void setMissionType(String missionType) { this.missionType = missionType; }

    public SpaceCelestialBody getTarget() { return target; }
    public void setTarget(SpaceCelestialBody target) { this.target = target; }
}
