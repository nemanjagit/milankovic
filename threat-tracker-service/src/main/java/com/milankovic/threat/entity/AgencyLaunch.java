package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

@RelationshipProperties
public class AgencyLaunch {

    @RelationshipId
    private String id;

    private String launchDate;
    private String launchSite;

    @TargetNode
    private Mission mission;

    public AgencyLaunch() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLaunchDate() { return launchDate; }
    public void setLaunchDate(String launchDate) { this.launchDate = launchDate; }

    public String getLaunchSite() { return launchSite; }
    public void setLaunchSite(String launchSite) { this.launchSite = launchSite; }

    public Mission getMission() { return mission; }
    public void setMission(Mission mission) { this.mission = mission; }
}
