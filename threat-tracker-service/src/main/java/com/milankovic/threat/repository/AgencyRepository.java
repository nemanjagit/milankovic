package com.milankovic.threat.repository;

import com.milankovic.threat.entity.Agency;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;

import java.util.List;

public interface AgencyRepository extends Neo4jRepository<Agency, String> {

    @Query("MATCH (a:Agency)-[:LAUNCHED]->(m:Mission) RETURN a.name AS name, a.country AS country, a.type AS type, count(m) AS missionCount ORDER BY missionCount DESC")
    List<AgencyStats> findAllWithMissionCount();

    @Query("MATCH (a1:Agency)-[:COLLABORATED_WITH]->(a2:Agency) WHERE a1.name <= a2.name RETURN a1.name AS source, a2.name AS target, count(*) AS weight ORDER BY weight DESC LIMIT 400")
    List<CollaborationEdge> findCollaborations();

    record AgencyStats(String name, String country, String type, Long missionCount) {}
    record CollaborationEdge(String source, String target, Long weight) {}
}
