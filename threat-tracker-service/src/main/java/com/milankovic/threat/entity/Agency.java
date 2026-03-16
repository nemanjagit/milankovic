package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.*;

import java.util.ArrayList;
import java.util.List;

@Node("Agency")
public class Agency {

    @Id
    private String name;

    private String country;
    private String type;

    @Relationship(type = "LAUNCHED", direction = Relationship.Direction.OUTGOING)
    private List<AgencyLaunch> launches = new ArrayList<>();

    @Relationship(type = "COLLABORATED_WITH", direction = Relationship.Direction.OUTGOING)
    private List<Collaboration> collaborations = new ArrayList<>();

    public Agency() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<AgencyLaunch> getLaunches() { return launches; }
    public void setLaunches(List<AgencyLaunch> launches) { this.launches = launches; }

    public List<Collaboration> getCollaborations() { return collaborations; }
    public void setCollaborations(List<Collaboration> collaborations) { this.collaborations = collaborations; }
}
