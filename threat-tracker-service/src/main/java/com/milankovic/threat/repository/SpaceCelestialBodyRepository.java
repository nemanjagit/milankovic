package com.milankovic.threat.repository;

import com.milankovic.threat.entity.SpaceCelestialBody;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;

import java.util.List;

public interface SpaceCelestialBodyRepository extends Neo4jRepository<SpaceCelestialBody, String> {

    @Query("MATCH (m:Mission)-[:TARGETED]->(b:CelestialBody) RETURN b.name AS name, b.type AS type, count(m) AS missionCount ORDER BY missionCount DESC")
    List<TargetStats> findAllWithMissionCount();

    record TargetStats(String name, String type, Long missionCount) {}
}
