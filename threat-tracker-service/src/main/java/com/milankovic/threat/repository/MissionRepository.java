package com.milankovic.threat.repository;

import com.milankovic.threat.entity.Mission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MissionRepository extends Neo4jRepository<Mission, String> {

    @Query(value = "MATCH (m:Mission) WHERE ($status IS NULL OR m.status = $status) RETURN m :#{orderBy(#pageable)} SKIP $skip LIMIT $limit",
           countQuery = "MATCH (m:Mission) WHERE ($status IS NULL OR m.status = $status) RETURN count(m)")
    Page<Mission> findByFilters(@Param("status") String status, Pageable pageable);

    @Query("MATCH (a:Agency {name: $agencyName})-[:LAUNCHED]->(m:Mission) RETURN m")
    List<Mission> findByAgencyName(@Param("agencyName") String agencyName);

    @Query("MATCH (m:Mission {id: $missionId}), (r:Rocket {name: $rocketName}) MERGE (m)-[:USED]->(r)")
    void linkMissionToRocket(@Param("missionId") String missionId, @Param("rocketName") String rocketName);

    @Query("MATCH (a:Agency)-[:LAUNCHED]->(m:Mission) RETURN a.name AS agencyName, a.country AS agencyCountry, m.status AS status, m.date AS date")
    List<MissionSummary> findAllSummaries();

    @Query("MATCH (m:Mission)-[:TARGETED]->(b:CelestialBody {name: $targetName}) RETURN m")
    List<Mission> findByTargetBody(@Param("targetName") String targetName);

    record MissionSummary(String agencyName, String agencyCountry, String status, String date) {}
}
