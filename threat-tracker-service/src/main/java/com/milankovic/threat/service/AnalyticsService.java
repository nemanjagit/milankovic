package com.milankovic.threat.service;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final Driver driver;

    public AnalyticsService(Driver driver) {
        this.driver = driver;
    }

    public List<Map<String, Object>> getAgencies() {
        try (Session session = driver.session()) {
            return session.run("""
                    MATCH (a:Agency)-[:LAUNCHED]->(m:Mission)
                    RETURN a.name AS name, a.country AS country, a.type AS type, count(m) AS missionCount
                    ORDER BY missionCount DESC
                    """).list(r -> Map.of(
                    "name", r.get("name").asString(""),
                    "country", r.get("country").asString(""),
                    "type", r.get("type").asString(""),
                    "missionCount", r.get("missionCount").asLong()
            ));
        }
    }

    public List<Map<String, Object>> getPageRank() {
        return runGds("""
                CALL gds.pageRank.stream('missionGraph')
                YIELD nodeId, score
                RETURN gds.util.asNode(nodeId).name AS entity, score
                ORDER BY score DESC LIMIT 20
                """, r -> Map.of(
                "entity", r.get("entity").asString(),
                "score", r.get("score").asDouble()
        ));
    }

    public List<Map<String, Object>> getAgencyCommunities() {
        return runGds("""
                CALL gds.louvain.stream('missionGraph')
                YIELD nodeId, communityId
                WITH gds.util.asNode(nodeId) AS node, communityId
                WHERE node:Agency
                RETURN node.name AS agencyName, communityId
                ORDER BY communityId
                """, r -> Map.of(
                "agencyName", r.get("agencyName").asString(""),
                "communityId", r.get("communityId").asLong()
        ));
    }

    public List<Map<String, Object>> getCommunities() {
        return runGds("""
                CALL gds.louvain.stream('missionGraph')
                YIELD nodeId, communityId
                RETURN communityId, count(*) AS size,
                       collect(gds.util.asNode(nodeId).name)[0..5] AS sampleMembers
                ORDER BY size DESC LIMIT 10
                """, r -> Map.of(
                "communityId", r.get("communityId").asLong(),
                "size", r.get("size").asLong(),
                "sampleMembers", r.get("sampleMembers").asList()
        ));
    }

    public List<Map<String, Object>> getSimilarity() {
        return runGds("""
                CALL gds.nodeSimilarity.stream('missionGraph')
                YIELD node1, node2, similarity
                WITH gds.util.asNode(node1) AS n1, gds.util.asNode(node2) AS n2, similarity
                WHERE n1:Agency AND n2:Agency
                RETURN n1.name AS agency1, n2.name AS agency2, similarity
                ORDER BY similarity DESC LIMIT 15
                """, r -> Map.of(
                "agency1", r.get("agency1").asString(""),
                "agency2", r.get("agency2").asString(""),
                "similarity", r.get("similarity").asDouble()
        ));
    }

    public List<Map<String, Object>> getConnectivity() {
        return runGds("""
                CALL gds.wcc.stream('missionGraph')
                YIELD nodeId, componentId
                RETURN componentId, count(*) AS size,
                       collect(gds.util.asNode(nodeId).name)[0..4] AS members
                ORDER BY size DESC LIMIT 10
                """, r -> Map.of(
                "componentId", r.get("componentId").asLong(),
                "size", r.get("size").asLong(),
                "members", r.get("members").asList()
        ));
    }

    private List<Map<String, Object>> runGds(String cypher,
            java.util.function.Function<org.neo4j.driver.Record, Map<String, Object>> mapper) {
        try (Session session = driver.session()) {
            return session.run(cypher).list(mapper);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("missionGraph")) {
                projectGraph();
                try (Session session = driver.session()) {
                    return session.run(cypher).list(mapper);
                } catch (Exception ignored) {}
            }
            return List.of();
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void projectGraph() {
        try (Session session = driver.session()) {
            // Derive COLLABORATED_WITH: agencies that both targeted the same celestial body
            session.run("""
                    MATCH (a1:Agency)-[:LAUNCHED]->(:Mission)-[:TARGETED]->(b:CelestialBody)
                          <-[:TARGETED]-(:Mission)<-[:LAUNCHED]-(a2:Agency)
                    WHERE a1.name < a2.name
                    MERGE (a1)-[:COLLABORATED_WITH]->(a2)
                    """).consume();

            // Drop existing projection if present
            try {
                session.run("CALL gds.graph.drop('missionGraph', false)").consume();
            } catch (Exception ignored) {}

            session.run("""
                    CALL gds.graph.project('missionGraph',
                      ['Agency','Mission','Rocket','CelestialBody'],
                      ['LAUNCHED','USED','TARGETED','COLLABORATED_WITH'])
                    """).consume();

        } catch (Exception e) {
            // DB not yet seeded — will succeed after POST /missions/seed
        }
    }
}
