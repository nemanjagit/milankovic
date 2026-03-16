package com.milankovic.celestial.dto;

public class BodyResponse {

    private String id;
    private String name;
    private String bodyType;
    private Double mass;
    private Double radius;
    private Integer meanTemp;
    private String discoveredBy;
    private OrbitalDataDto orbitalData;
    private PhysicalPropertiesDto physicalProperties;

    public BodyResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }

    public Double getMass() { return mass; }
    public void setMass(Double mass) { this.mass = mass; }

    public Double getRadius() { return radius; }
    public void setRadius(Double radius) { this.radius = radius; }

    public Integer getMeanTemp() { return meanTemp; }
    public void setMeanTemp(Integer meanTemp) { this.meanTemp = meanTemp; }

    public String getDiscoveredBy() { return discoveredBy; }
    public void setDiscoveredBy(String discoveredBy) { this.discoveredBy = discoveredBy; }

    public OrbitalDataDto getOrbitalData() { return orbitalData; }
    public void setOrbitalData(OrbitalDataDto orbitalData) { this.orbitalData = orbitalData; }

    public PhysicalPropertiesDto getPhysicalProperties() { return physicalProperties; }
    public void setPhysicalProperties(PhysicalPropertiesDto physicalProperties) { this.physicalProperties = physicalProperties; }

    public static class OrbitalDataDto {
        private Double semiMajorAxis;
        private Double periodDays;
        private Double eccentricity;
        private Double inclination;
        private Double velocityKmS;

        public Double getSemiMajorAxis() { return semiMajorAxis; }
        public void setSemiMajorAxis(Double semiMajorAxis) { this.semiMajorAxis = semiMajorAxis; }

        public Double getPeriodDays() { return periodDays; }
        public void setPeriodDays(Double periodDays) { this.periodDays = periodDays; }

        public Double getEccentricity() { return eccentricity; }
        public void setEccentricity(Double eccentricity) { this.eccentricity = eccentricity; }

        public Double getInclination() { return inclination; }
        public void setInclination(Double inclination) { this.inclination = inclination; }

        public Double getVelocityKmS() { return velocityKmS; }
        public void setVelocityKmS(Double velocityKmS) { this.velocityKmS = velocityKmS; }
    }

    public static class PhysicalPropertiesDto {
        private Double gravity;
        private Double escapeSpeed;
        private Double rotationPeriod;
        private Double axialTilt;
        private Double surfacePressure;

        public Double getGravity() { return gravity; }
        public void setGravity(Double gravity) { this.gravity = gravity; }

        public Double getEscapeSpeed() { return escapeSpeed; }
        public void setEscapeSpeed(Double escapeSpeed) { this.escapeSpeed = escapeSpeed; }

        public Double getRotationPeriod() { return rotationPeriod; }
        public void setRotationPeriod(Double rotationPeriod) { this.rotationPeriod = rotationPeriod; }

        public Double getAxialTilt() { return axialTilt; }
        public void setAxialTilt(Double axialTilt) { this.axialTilt = axialTilt; }

        public Double getSurfacePressure() { return surfacePressure; }
        public void setSurfacePressure(Double surfacePressure) { this.surfacePressure = surfacePressure; }
    }
}