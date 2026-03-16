package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.*;

@Node("CelestialBody")
public class SpaceCelestialBody {

    @Id
    private String name;

    private String type;

    public SpaceCelestialBody() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
