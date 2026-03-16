package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.*;

@Node("OrbitFamily")
public class OrbitFamily {

    @Id
    private String name;

    public OrbitFamily() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
