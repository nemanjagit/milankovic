package com.milankovic.threat.service;

import com.milankovic.threat.entity.SmallBody;
import com.milankovic.threat.exception.ThreatScanException;
import com.milankovic.threat.repository.SmallBodyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class ThreatService {

    private final SmallBodyRepository smallBodyRepository;
    private final Neo4jClient neo4jClient;
    private final RestTemplate restTemplate;

    @Value("${jpl.sbdb.url}")
    private String sbdbUrl;

    @Value("${jpl.cad.url}")
    private String cadUrl;

    public ThreatService(SmallBodyRepository smallBodyRepository, Neo4jClient neo4jClient, RestTemplate restTemplate) {
        this.smallBodyRepository = smallBodyRepository;
        this.neo4jClient = neo4jClient;
        this.restTemplate = restTemplate;
    }

    public List<SmallBody> getAllNeos() {
        return smallBodyRepository.findAll();
    }

    public List<SmallBody> getHazardous() {
        return smallBodyRepository.findAllHazardous();
    }

    public List<SmallBody> getApproachesByPlanet(String planet) {
        return smallBodyRepository.findByApproachPlanet(planet);
    }

    public List<SmallBody> getThreatsForPlanet(String planetName) {
        return smallBodyRepository.findThreatsForPlanet(planetName);
    }

    public List<Map<String, Object>> scanThreatsWithDistance(String planetName) {
        return new ArrayList<>(neo4jClient.query("""
                MATCH (s:SmallBody)-[:THREATENS]->(p:Planet {name: $planet})
                OPTIONAL MATCH (s)-[a:APPROACHES]->(p)
                RETURN s.id AS id, s.name AS name, s.hazardous AS hazardous,
                       min(a.distanceAu) AS distanceAu
                ORDER BY distanceAu ASC
                """)
                .bind(planetName).to("planet")
                .fetch()
                .all()
                .stream()
                .map(r -> (Map<String, Object>) new HashMap<>(r))
                .toList());
    }

    public List<SmallBody> getNetworkForBody(String bodyName) {
        return smallBodyRepository.findNetworkForBody(bodyName);
    }

    @SuppressWarnings("unchecked")
    public int seedThreats() {
        try {
            String url = cadUrl + "?dist-max=0.2&date-min=2020-01-01&body=Earth&nea-comet=Y";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) throw new ThreatScanException("JPL CAD API returned null");

            List<String> fields = (List<String>) response.get("fields");
            List<List<Object>> data = (List<List<Object>>) response.get("data");
            if (data == null) return 0;

            int desIdx = fields.indexOf("des");
            int cdIdx = fields.indexOf("cd");
            int distIdx = fields.indexOf("dist");

            // Build batch lists
            List<Map<String, Object>> bodies = new ArrayList<>();
            List<Map<String, Object>> approaches = new ArrayList<>();
            List<String> threatIds = new ArrayList<>();
            Set<String> seenBodies = new HashSet<>();

            for (List<Object> row : data) {
                String des = row.get(desIdx).toString().trim();
                String date = row.get(cdIdx).toString().trim();
                String distStr = row.get(distIdx).toString().trim();

                double distAu;
                try { distAu = Double.parseDouble(distStr); } catch (NumberFormatException e) { continue; }

                boolean hazardous = distAu < 0.05;

                if (!seenBodies.contains(des)) {
                    Map<String, Object> b = new HashMap<>();
                    b.put("id", des);
                    b.put("name", des);
                    b.put("hazardous", hazardous);
                    bodies.add(b);
                    seenBodies.add(des);
                }

                Map<String, Object> a = new HashMap<>();
                a.put("id", des);
                a.put("date", date);
                a.put("dist", distAu);
                approaches.add(a);

                if (hazardous) threatIds.add(des);
            }

            // Ensure Earth exists
            neo4jClient.query("MERGE (p:Planet {name: 'Earth'})").run();

            // Batch MERGE SmallBody nodes
            neo4jClient.query("""
                    UNWIND $bodies AS b
                    MERGE (s:SmallBody {id: b.id})
                    SET s.name = b.name, s.designation = b.id, s.bodyType = 'asteroid', s.hazardous = b.hazardous
                    """)
                    .bind(bodies).to("bodies")
                    .run();

            // Batch MERGE APPROACHES relationships
            neo4jClient.query("""
                    UNWIND $approaches AS a
                    MATCH (s:SmallBody {id: a.id}), (p:Planet {name: 'Earth'})
                    MERGE (s)-[:APPROACHES {date: a.date, distanceAu: a.dist}]->(p)
                    """)
                    .bind(approaches).to("approaches")
                    .run();

            // Batch MERGE THREATENS relationships
            if (!threatIds.isEmpty()) {
                neo4jClient.query("""
                        UNWIND $ids AS id
                        MATCH (s:SmallBody {id: id}), (p:Planet {name: 'Earth'})
                        MERGE (s)-[:THREATENS]->(p)
                        """)
                        .bind(threatIds).to("ids")
                        .run();
            }

            return approaches.size();

        } catch (ThreatScanException e) {
            throw e;
        } catch (Exception e) {
            throw new ThreatScanException("Failed to seed threats: " + e.getMessage());
        }
    }
}