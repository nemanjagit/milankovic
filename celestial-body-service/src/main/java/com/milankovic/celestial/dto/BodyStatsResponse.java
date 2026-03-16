package com.milankovic.celestial.dto;

import java.util.Map;

public class BodyStatsResponse {
    private long totalBodies;
    private Map<String, Long> countByType;
    private Double averageMass;

    public BodyStatsResponse() {}

    public long getTotalBodies() { return totalBodies; }
    public void setTotalBodies(long totalBodies) { this.totalBodies = totalBodies; }

    public Map<String, Long> getCountByType() { return countByType; }
    public void setCountByType(Map<String, Long> countByType) { this.countByType = countByType; }

    public Double getAverageMass() { return averageMass; }
    public void setAverageMass(Double averageMass) { this.averageMass = averageMass; }
}