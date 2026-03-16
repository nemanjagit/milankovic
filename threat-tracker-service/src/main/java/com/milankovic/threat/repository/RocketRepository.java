package com.milankovic.threat.repository;

import com.milankovic.threat.entity.Rocket;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;

import java.util.List;

public interface RocketRepository extends Neo4jRepository<Rocket, String> {

    @Query("MATCH (m:Mission)-[:USED]->(r:Rocket) RETURN r.name AS name, r.status AS status, r.costPerLaunchUsd AS costPerLaunchUsd, count(m) AS missionCount ORDER BY missionCount DESC")
    List<RocketStats> findAllWithUsageCount();

    record RocketStats(String name, String status, Double costPerLaunchUsd, Long missionCount) {}
}
