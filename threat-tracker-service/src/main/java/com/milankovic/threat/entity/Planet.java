package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.*;

@Node("Planet")
public class Planet {

    @Id
    private String name;

    private Double semiMajorAxisAu;
    private String bodyId;

    public Planet() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getSemiMajorAxisAu() { return semiMajorAxisAu; }
    public void setSemiMajorAxisAu(Double semiMajorAxisAu) { this.semiMajorAxisAu = semiMajorAxisAu; }

    public String getBodyId() { return bodyId; }
    public void setBodyId(String bodyId) { this.bodyId = bodyId; }
}
