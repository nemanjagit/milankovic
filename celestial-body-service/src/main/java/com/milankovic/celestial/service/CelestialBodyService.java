package com.milankovic.celestial.service;

import com.milankovic.celestial.dto.BodyResponse;
import com.milankovic.celestial.dto.BodyStatsResponse;
import com.milankovic.celestial.dto.MoonResponse;
import com.milankovic.celestial.entity.Body;
import com.milankovic.celestial.entity.Moon;
import com.milankovic.celestial.entity.OrbitalData;
import com.milankovic.celestial.entity.PhysicalProperties;
import com.milankovic.celestial.exception.BodyNotFoundException;
import com.milankovic.celestial.repository.BodyRepository;
import com.milankovic.celestial.repository.MoonRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CelestialBodyService {

    private final BodyRepository bodyRepository;
    private final MoonRepository moonRepository;
    private final RestTemplate restTemplate;

    @Value("${solar-system-api.base-url}")
    private String solarSystemApiBaseUrl;

    @Value("${solar-system-api.key}")
    private String solarSystemApiKey;

    public CelestialBodyService(BodyRepository bodyRepository, MoonRepository moonRepository, RestTemplate restTemplate) {
        this.bodyRepository = bodyRepository;
        this.moonRepository = moonRepository;
        this.restTemplate = restTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void autoSeed() {
        if (bodyRepository.count() == 0) {
            try { seedFromApi(); } catch (Exception e) { /* external API unavailable */ }
        }
    }

    public Page<BodyResponse> getAllBodies(String bodyType, Pageable pageable) {
        Page<Body> page = (bodyType != null && !bodyType.isBlank())
                ? bodyRepository.findByBodyType(bodyType, pageable)
                : bodyRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    public BodyResponse getBodyById(String id) {
        Body body = bodyRepository.findById(id)
                .orElseThrow(() -> new BodyNotFoundException(id));
        return toFullResponse(body);
    }

    public List<MoonResponse> getMoonsByBodyId(String bodyId) {
        if (!bodyRepository.existsById(bodyId)) {
            throw new BodyNotFoundException(bodyId);
        }
        return moonRepository.findByBodyId(bodyId).stream().map(this::toMoonResponse).toList();
    }

    public List<BodyResponse> searchByName(String name) {
        return bodyRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::toResponse)
                .toList();
    }

    public BodyStatsResponse getStats() {
        BodyStatsResponse stats = new BodyStatsResponse();
        stats.setTotalBodies(bodyRepository.count());
        stats.setAverageMass(bodyRepository.averageMass());

        Map<String, Long> countByType = new HashMap<>();
        for (Object[] row : bodyRepository.countByBodyType()) {
            countByType.put((String) row[0], (Long) row[1]);
        }
        stats.setCountByType(countByType);
        return stats;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public int seedFromApi() {
        String url = solarSystemApiBaseUrl + "/bodies";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + solarSystemApiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        Map<String, Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class).getBody();
        if (response == null || !response.containsKey("bodies")) return 0;

        List<Map<String, Object>> bodies = (List<Map<String, Object>>) response.get("bodies");
        int count = 0;

        for (Map<String, Object> data : bodies) {
            String id = (String) data.get("id");
            if (id == null) continue;

            Body body = bodyRepository.findById(id).orElse(new Body());
            body.setId(id);
            body.setName(firstNonBlank((String) data.get("englishName"), (String) data.get("name"), id));
            body.setBodyType((String) data.get("bodyType"));
            body.setDiscoveredBy(blankToNull((String) data.get("discoveredBy")));

            Object massObj = data.get("mass");
            if (massObj instanceof Map<?, ?> massMap) {
                Object massValue = massMap.get("massValue");
                Object massExp = massMap.get("massExponent");
                if (massValue instanceof Number mv && massExp instanceof Number me) {
                    body.setMass(mv.doubleValue() * Math.pow(10, me.doubleValue()));
                }
            }

            Object meanRadius = data.get("meanRadius");
            if (meanRadius instanceof Number r) body.setRadius(normalizeRadius(r.doubleValue()));

            Object meanTemp = data.get("avgTemp");
            if (meanTemp instanceof Number t) body.setMeanTemp(normalizeTemperature(t.intValue()));

            body = bodyRepository.save(body);

            // Orbital data
            OrbitalData orbital = body.getOrbitalData() != null ? body.getOrbitalData() : new OrbitalData();
            orbital.setBody(body);
            orbital.setSemiMajorAxis(normalizeZeroToNull(toDouble(data.get("semimajorAxis"))));
            orbital.setPeriodDays(normalizeZeroToNull(toDouble(data.get("sideralOrbit"))));
            orbital.setEccentricity(normalizeZeroToNull(toDouble(data.get("eccentricity"))));
            orbital.setInclination(normalizeZeroToNull(toDouble(data.get("inclination"))));
            orbital.setMainAnomaly(normalizeZeroToNull(toDouble(data.get("mainAnomaly"))));

            Object vol = data.get("vol");
            if (vol instanceof Map<?, ?> volMap) {
                Object volVal = volMap.get("volValue");
                Object volExp = volMap.get("volExponent");
                if (volVal instanceof Number vv && volExp instanceof Number ve) {
                    // store as placeholder for velocity — actual data doesn't have velocity per body
                }
            }
            body.setOrbitalData(orbital);

            // Physical properties
            PhysicalProperties phys = body.getPhysicalProperties() != null ? body.getPhysicalProperties() : new PhysicalProperties();
            phys.setBody(body);
            phys.setGravity(normalizeZeroToNull(toDouble(data.get("gravity"))));
            phys.setEscapeSpeed(normalizeZeroToNull(toDouble(data.get("escape"))));
            phys.setRotationPeriod(normalizeZeroToNull(toDouble(data.get("sideralRotation"))));
            phys.setAxialTilt(normalizeZeroToNull(toDouble(data.get("axialTilt"))));
            body.setPhysicalProperties(phys);

            bodyRepository.save(body);

            // Moons
            Object moonsObj = data.get("moons");
            if (moonsObj instanceof List<?> moonList) {
                for (Object moonObj : moonList) {
                    if (moonObj instanceof Map<?, ?> moonMap) {
                        String moonId = (String) moonMap.get("moon");
                        if (moonId == null) continue;
                        Moon moon = moonRepository.findById(moonId).orElse(new Moon());
                        moon.setId(moonId);
                        moon.setName(moonId);
                        moon.setBody(body);
                        moon.setParentId(id);
                        moonRepository.save(moon);
                    }
                }
            }

            count++;
        }
        return count;
    }

    private Double toDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        return null;
    }

    private Double normalizeZeroToNull(Double value) {
        if (value == null || Double.compare(value, 0.0) == 0) {
            return null;
        }
        return value;
    }

    private Double normalizeRadius(Double value) {
        return normalizeZeroToNull(value);
    }

    private Integer normalizeTemperature(Integer value) {
        if (value == null || value == 0) {
            return null;
        }
        return value;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private BodyResponse toResponse(Body body) {
        BodyResponse r = new BodyResponse();
        r.setId(body.getId());
        r.setName(body.getName());
        r.setBodyType(body.getBodyType());
        r.setMass(body.getMass());
        r.setRadius(body.getRadius());
        r.setMeanTemp(body.getMeanTemp());
        r.setDiscoveredBy(body.getDiscoveredBy());
        return r;
    }

    private BodyResponse toFullResponse(Body body) {
        BodyResponse r = toResponse(body);

        if (body.getOrbitalData() != null) {
            OrbitalData o = body.getOrbitalData();
            BodyResponse.OrbitalDataDto dto = new BodyResponse.OrbitalDataDto();
            dto.setSemiMajorAxis(o.getSemiMajorAxis());
            dto.setPeriodDays(o.getPeriodDays());
            dto.setEccentricity(o.getEccentricity());
            dto.setInclination(o.getInclination());
            dto.setMainAnomaly(o.getMainAnomaly());
            dto.setVelocityKmS(o.getVelocityKmS());
            r.setOrbitalData(dto);
        }

        if (body.getPhysicalProperties() != null) {
            PhysicalProperties p = body.getPhysicalProperties();
            BodyResponse.PhysicalPropertiesDto dto = new BodyResponse.PhysicalPropertiesDto();
            dto.setGravity(p.getGravity());
            dto.setEscapeSpeed(p.getEscapeSpeed());
            dto.setRotationPeriod(p.getRotationPeriod());
            dto.setAxialTilt(p.getAxialTilt());
            dto.setSurfacePressure(p.getSurfacePressure());
            r.setPhysicalProperties(dto);
        }

        return r;
    }

    private MoonResponse toMoonResponse(Moon moon) {
        MoonResponse r = new MoonResponse();
        r.setId(moon.getId());
        r.setName(moon.getName());
        r.setParentId(moon.getParentId());
        r.setDiscoveryYear(moon.getDiscoveryYear());
        return r;
    }
}
