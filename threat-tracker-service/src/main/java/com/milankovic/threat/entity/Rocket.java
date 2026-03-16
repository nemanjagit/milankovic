package com.milankovic.threat.entity;

import org.springframework.data.neo4j.core.schema.*;

@Node("Rocket")
public class Rocket {

    @Id
    private String name;

    private String status;
    private Double costPerLaunchUsd;

    @Relationship(type = "SUCCEEDED_BY", direction = Relationship.Direction.OUTGOING)
    private Rocket succeededBy;

    public Rocket() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getCostPerLaunchUsd() { return costPerLaunchUsd; }
    public void setCostPerLaunchUsd(Double costPerLaunchUsd) { this.costPerLaunchUsd = costPerLaunchUsd; }

    public Rocket getSucceededBy() { return succeededBy; }
    public void setSucceededBy(Rocket succeededBy) { this.succeededBy = succeededBy; }
}
