package com.milankovic.celestial.dto;

public class MoonResponse {
    private String id;
    private String name;
    private String parentId;
    private Integer discoveryYear;

    public MoonResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }

    public Integer getDiscoveryYear() { return discoveryYear; }
    public void setDiscoveryYear(Integer discoveryYear) { this.discoveryYear = discoveryYear; }
}