package com.milankovic.celestial.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "moon")
public class Moon {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "body_id", nullable = false)
    private Body body;

    @Column(name = "parent_id")
    private String parentId;

    @Column(name = "name")
    private String name;

    @Column(name = "discovery_year")
    private Integer discoveryYear;

    public Moon() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Body getBody() { return body; }
    public void setBody(Body body) { this.body = body; }

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getDiscoveryYear() { return discoveryYear; }
    public void setDiscoveryYear(Integer discoveryYear) { this.discoveryYear = discoveryYear; }
}