package com.milankovic.threat.repository;

import com.milankovic.threat.entity.SmallBody;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SmallBodyRepository extends Neo4jRepository<SmallBody, String> {

    @Query("MATCH (s:SmallBody) WHERE s.hazardous = true RETURN s")
    List<SmallBody> findAllHazardous();

    @Query("MATCH (s:SmallBody)-[a:APPROACHES]->(p:Planet {name: $planetName}) RETURN s, a, p ORDER BY a.distanceAu ASC")
    List<SmallBody> findByApproachPlanet(@Param("planetName") String planetName);

    @Query("MATCH (s:SmallBody)-[t:THREATENS]->(p:Planet {name: $planetName}) RETURN s")
    List<SmallBody> findThreatsForPlanet(@Param("planetName") String planetName);

    @Query("MATCH path = (s:SmallBody {name: $bodyName})-[*1..2]-(n) RETURN path")
    List<SmallBody> findNetworkForBody(@Param("bodyName") String bodyName);
}
