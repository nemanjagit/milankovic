package com.milankovic.threat.service;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class MissionSeedService {

    private final Neo4jClient neo4jClient;

    private static final int COL_COMPANY = 2;
    private static final int COL_LOCATION = 3;
    private static final int COL_DATE = 4;
    private static final int COL_DETAIL = 5;
    private static final int COL_ROCKET_STATUS = 6;
    private static final int COL_PRICE = 7;
    private static final int COL_MISSION_STATUS = 8;

    private static final Map<String, String> AGENCY_COUNTRIES = Map.ofEntries(
            Map.entry("NASA", "USA"), Map.entry("SpaceX", "USA"), Map.entry("CASC", "China"),
            Map.entry("Roscosmos", "Russia"), Map.entry("ESA", "Europe"), Map.entry("ISRO", "India"),
            Map.entry("JAXA", "Japan"), Map.entry("Arianespace", "France"), Map.entry("ULA", "USA"),
            Map.entry("Boeing", "USA"), Map.entry("RocketLab", "USA"), Map.entry("Northrop", "USA")
    );

    private static final List<String> KNOWN_TARGETS = List.of(
            "Moon", "Mars", "Venus", "Mercury", "Jupiter", "Saturn", "ISS", "Sun", "Earth"
    );

    public MissionSeedService(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public int seed() throws IOException, CsvException {
        ClassPathResource resource = new ClassPathResource("missions.csv");
        if (!resource.exists()) {
            throw new IllegalStateException("missions.csv not found in resources/");
        }

        // Seed known celestial body targets
        for (String targetName : KNOWN_TARGETS) {
            String type = targetName.equals("ISS") ? "Station" : "Planet";
            neo4jClient.query("MERGE (b:CelestialBody {name: $name}) SET b.type = $type")
                    .bind(targetName).to("name")
                    .bind(type).to("type")
                    .run();
        }

        int count = 0;

        try (CSVReader reader = new CSVReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            List<String[]> rows = reader.readAll();
            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);
                if (row.length < 9) continue;

                String companyName = row[COL_COMPANY].trim();
                String location = row[COL_LOCATION].trim();
                String date = row[COL_DATE].trim();
                String detail = row[COL_DETAIL].trim();
                String rocketStatus = row[COL_ROCKET_STATUS].trim();
                String priceStr = row[COL_PRICE].trim();
                String missionStatus = row[COL_MISSION_STATUS].trim();

                String rocketName = extractRocketName(detail);
                String missionName = extractMissionName(detail);
                String missionId = companyName + "_" + i;

                // Check if already seeded
                long exists = neo4jClient.query("MATCH (m:Mission {id: $id}) RETURN count(m)")
                        .bind(missionId).to("id")
                        .fetchAs(Long.class).one().orElse(0L);
                if (exists > 0) { count++; continue; }

                Double cost = null;
                if (!priceStr.isBlank()) {
                    try { cost = Double.parseDouble(priceStr.replace(",", "").trim()); } catch (NumberFormatException ignored) {}
                }

                // MERGE Agency
                String agencyCountry = AGENCY_COUNTRIES.getOrDefault(companyName, "Unknown");
                String agencyType = isGovernment(companyName) ? "Government" : "Private";
                neo4jClient.query("MERGE (a:Agency {name: $name}) SET a.country = $country, a.type = $type")
                        .bind(companyName).to("name")
                        .bind(agencyCountry).to("country")
                        .bind(agencyType).to("type")
                        .run();

                // MERGE Rocket
                String normalizedRocketStatus = rocketStatus.isBlank() ? "Unknown" : rocketStatus.replace("Status", "");
                neo4jClient.query("MERGE (r:Rocket {name: $name}) SET r.status = $status")
                        .bind(rocketName).to("name")
                        .bind(normalizedRocketStatus).to("status")
                        .run();

                // MERGE Mission
                String normalizedStatus = normalizeStatus(missionStatus);
                neo4jClient.query("MERGE (m:Mission {id: $id}) SET m.name = $name, m.date = $date, m.status = $status, m.costUsd = $cost")
                        .bind(missionId).to("id")
                        .bind(missionName).to("name")
                        .bind(date).to("date")
                        .bind(normalizedStatus).to("status")
                        .bind(cost).to("cost")
                        .run();

                // USED relationship: Mission → Rocket
                neo4jClient.query("MATCH (m:Mission {id: $missionId}), (r:Rocket {name: $rocketName}) MERGE (m)-[:USED]->(r)")
                        .bind(missionId).to("missionId")
                        .bind(rocketName).to("rocketName")
                        .run();

                // LAUNCHED relationship: Agency → Mission
                neo4jClient.query("MATCH (a:Agency {name: $agencyName}), (m:Mission {id: $missionId}) MERGE (a)-[l:LAUNCHED]->(m) SET l.launchDate = $date, l.launchSite = $site")
                        .bind(companyName).to("agencyName")
                        .bind(missionId).to("missionId")
                        .bind(date).to("date")
                        .bind(location).to("site")
                        .run();

                // TARGETED relationships: Mission → CelestialBody
                for (String targetName : KNOWN_TARGETS) {
                    if (detail.contains(targetName) || location.contains(targetName)) {
                        neo4jClient.query("MATCH (m:Mission {id: $missionId}), (b:CelestialBody {name: $targetName}) MERGE (m)-[:TARGETED {missionType: 'Unspecified'}]->(b)")
                                .bind(missionId).to("missionId")
                                .bind(targetName).to("targetName")
                                .run();
                    }
                }

                count++;
            }
        }

        return count;
    }

    private String extractRocketName(String detail) {
        if (detail.contains("|")) return detail.substring(0, detail.indexOf("|")).trim();
        return detail.length() > 100 ? detail.substring(0, 100).trim() : detail.trim();
    }

    private String extractMissionName(String detail) {
        if (detail.contains("|")) return detail.substring(detail.indexOf("|") + 1).trim();
        return detail.trim();
    }

    private String normalizeStatus(String status) {
        return switch (status.toLowerCase().trim()) {
            case "success" -> "Success";
            case "failure" -> "Failure";
            case "partial failure" -> "Partial";
            case "prelaunch failure" -> "Failure";
            default -> "Unknown";
        };
    }

    private boolean isGovernment(String name) {
        return List.of("NASA", "Roscosmos", "CASC", "ISRO", "JAXA", "ESA", "CNES", "DLR").contains(name);
    }
}