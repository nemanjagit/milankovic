# MILANKOVIC Build Progress

Last updated: 2026-03-08 (session 3)

## Legend
- [x] Done
- [~] In progress
- [ ] Not started

---

## Phase 1 — Foundation ✅

- [x] Parent `pom.xml` with 7 modules (Java 21, Boot 3.3.4, Cloud 2023.0.3)
- [x] naming-server (Eureka, port 8761)
- [x] config-server (native profile, port 8888)
- [x] api-gateway (Spring Cloud Gateway, port 8080)
- [x] celestial-body-service stub (port 8081)
- [x] threat-tracker-service stub (port 8082)
- [x] observer-service stub (port 8083)
- [x] alert-service stub (port 8084)
- [x] Full build: `mvn clean package -DskipTests` ✓
- [x] All 7 services registered on Eureka dashboard
- [x] `-parameters` compiler flag added to parent pom.xml

---

## Phase 2 — Celestial Body Service (8081) ✅

- [x] Entities: Body, OrbitalData, PhysicalProperties, Moon
- [x] Repositories: BodyRepository, MoonRepository
- [x] GET /bodies — paginated, filter by type
- [x] GET /bodies/{id} — full telemetry
- [x] GET /bodies/{id}/moons
- [x] GET /bodies/search?name=
- [x] GET /bodies/stats
- [x] POST /bodies/seed — Solar System OpenData API (requires Bearer API key)
- [x] GlobalExceptionHandler
- [x] **Seeded: 515 celestial bodies**

---

## Phase 3 — Threat Tracker / Space Missions Service (8082) ✅

### Space Missions Graph (Neo4j)
- [x] Nodes: Mission, Agency, Rocket, SpaceCelestialBody
- [x] Relationships: LAUNCHED, USED, TARGETED, COLLABORATED_WITH, SUCCEEDED_BY
- [x] POST /missions/seed — CSV reader, Neo4jClient MERGE queries
- [x] **Seeded: 4,324 missions**

### Threat Graph (Neo4j)
- [x] Nodes: SmallBody, Planet, CloseApproach, OrbitFamily
- [x] Relationships: APPROACHES, THREATENS, BELONGS_TO, SHARES_CORRIDOR
- [x] POST /threats/seed — JPL CAD API, batch UNWIND queries
- [x] **Seeded: 24,433 threat approaches**

### REST Endpoints
- [x] GET /missions, GET /missions/{id}
- [x] GET /agencies, GET /agencies/{name}/missions, GET /agencies/{name}/network
- [x] GET /rockets, GET /targets
- [x] GET /analytics/pagerank, GET /analytics/communities
- [x] GET /threats/neo, GET /threats/hazardous
- [x] GET /threats/approaches?planet=, GET /threats/network/{bodyName}
- [x] GET /threats/scan/{planetName}

### Fixes Applied
- [x] @RelationshipId Long → String (Neo4j 5.x compatibility)
- [x] MissionSeedService rewritten with Neo4jClient (no deprecated id())
- [x] ThreatService rewritten with Neo4jClient batch UNWIND queries
- [x] @Param annotations on all repository query methods

### Analytics
- [ ] GDS graph projection + PageRank, Louvain, WCC screenshots
- [ ] 8 exploratory Cypher queries + screenshots

---

## Phase 4 — Observer Service (8083) ✅

- [x] Entities: Observer, ObserverMission, WatchlistEntry, ObservationLog
- [x] Feign → CelestialBodyClient, ThreatTrackerClient
- [x] POST /observers, GET /observers/{id}
- [x] POST /observers/watchlist, GET /observers/{id}/watchlist
- [x] POST /observers/missions/{id}/activate
- [x] GET /observers/{id}/threat-summary ✓ tested
- [x] GET /observers/missions/active/report

---

## Phase 4 — Alert Service (8084) ✅

- [x] Entities: Alert, Notification, EventLog, AlertRule
- [x] Feign → ThreatTrackerClient, ObserverClient
- [x] POST /alerts/scan — **992 alerts generated** ✓
- [x] POST /alerts/{id}/escalate
- [x] GET /alerts/dashboard
- [x] CRUD AlertRule

---

## Phase 5 — API Gateway + Security ✅

- [x] Routes: /bodies/**, /threats/**, /missions/**, /agencies/**, /rockets/**, /targets/**, /analytics/**, /observers/**, /alerts/**
- [x] JWT auth filter (JJWT 0.12.6)
- [x] POST /auth/register, POST /auth/login
- [x] eureka.instance.prefer-ip-address=true (fixed hostname resolution)
- [x] Full flow tested: login → token → all endpoints via :8080 ✓

---

## Phase 6 — Docker

- [ ] Dockerfile for each service (openjdk:21-jdk-slim)
- [ ] docker-compose.yml: postgres ×3, neo4j 5.13 + GDS 2.6.8, all 7 services
- [ ] docker compose up — all services healthy
- [ ] Push images to Docker Hub + save docker-images.txt

---

## Phase 7 — Report + Frontend

### NoSQL Analytics Report
- [ ] Run 8 exploratory Cypher queries + screenshot
- [ ] Run PageRank, Louvain, NodeSimilarity, WCC + screenshot + interpret
- [ ] Write report: dataset, schema, queries, algorithms, conclusions
- [ ] Export Cypher script file

### React Frontend
- [ ] Three.js 3D solar system
- [ ] CesiumJS Earth globe
- [ ] 3d-force-graph mission network
- [ ] Telemetry panel + Alert feed
- [ ] Aesthetic: #020408 / #00B4FF / #00FF96, Orbitron font

---

## Submission Checklist

- [ ] `mvn clean` — remove /target folders
- [ ] ZIP archive with all modules + docker-compose.yml at root
- [ ] docker-images.txt with Docker Hub URLs
- [ ] Postman collection: register → login → seed → mission → scan → results
- [ ] Neo4j Browser screenshots ready
- [ ] Practice demo run < 10 minutes

---

## Infrastructure (Docker containers)

| Container | Image | Port | DB |
|---|---|---|---|
| celestial-pg | postgres:16 | 5432 | celestial_db |
| observer-pg | postgres:16 | 5433 | observer_db |
| alert-pg | postgres:16 | 5434 | alert_db |
| neo4j | neo4j:5.13.0 + GDS 2.6.8 | 7474/7687 | — |