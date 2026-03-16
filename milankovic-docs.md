# MILANKOVIC — Space Intelligence Platform
## Technical Documentation

**Stack:** Java / Spring Boot · PostgreSQL · Neo4j · React + Three.js · Docker

---

## College Requirements Coverage

### Requirement 1 — Neo4j Graph Analytics (NoSQL Subject)
The goal is to independently apply graph databases and graph algorithms to a real dataset. This is fully satisfied by the **Space Missions Service** (Section 4):
- Dataset: ~4,600 space missions from 1957–present (Kaggle CSV)
- Graph schema: Mission, Agency, Rocket, CelestialBody nodes with LAUNCHED, USED, TARGETED, COLLABORATED_WITH relationships
- Import: Spring Boot seed endpoint reads CSV via OpenCSV, persists via Spring Data Neo4j
- Exploratory analysis: 8 Cypher queries covering aggregations, filtering, pattern matching, path traversal
- GDS algorithms: PageRank (centrality), Louvain (community detection), NodeSimilarity (similarity), WCC (connectivity)
- Results interpreted in domain context with research questions defined upfront

### Requirement 2 — Microservices Architecture (Distributed Systems Subject)
Full requirement breakdown:

| Requirement | Implementation |
|---|---|
| Min 3 domain microservices | 4 domain services: Celestial Body, Threat Tracker, Observer & Mission, Alert & Event |
| Each service has own DB with 3+ tables | celestial_db (4 tables), threat_graph (Neo4j), observer_db (4 tables), alert_db (4 tables) |
| Feign-based inter-service communication | Observer calls Celestial Body; Alert calls Threat Tracker + Observer |
| Complex operations beyond CRUD | Mission activate (Feign validate), threat-summary aggregation, alert scan job (scheduled) |
| Validation + error handling | Bean Validation on all DTOs, @ControllerAdvice, Feign error decoder |
| API Gateway (Spring Security + JWT) | Spring Cloud Gateway on port 8080, JWT filter, ROLE_ADMIN / ROLE_OBSERVER |
| Naming Server (Eureka) | All services register on Eureka at port 8761 |
| Config Server | Spring Cloud Config Server on port 8888, Git-backed |
| Docker + docker-compose | Dockerfile per service, full docker-compose.yml stack |
| Docker image URLs + txt file | Pushed to Docker Hub, URLs saved in txt file |

**Scoring breakdown:** Microservices 19pts + Gateway 4pts + Naming Server 3pts + Config Server 3pts + Docker 6pts = **35 points total**

---

## 1. Project Overview

MILANKOVIC is a space intelligence platform named after the Renaissance astronomer Nicolaus Milankovic. It tracks celestial bodies, near-Earth objects (NEOs), and the full history of human space exploration. The system is built as a Spring Boot microservices backend with a Neo4j graph analytics layer, deployed as a single Docker stack from a mono-repo.

> The Space Missions microservice and the Neo4j graph analytics layer are fully integrated — the same database instance powers both the REST API and the graph analysis. The graph is a live, queryable part of the running system, not a separate analysis tool.

### 1.1 Architecture Pillars

| Pillar | Description |
|---|---|
| Microservices (Spring Boot) | 4 domain services, API Gateway, Naming Server, Config Server. All services communicate via Feign and are containerised with Docker. |
| Relational Storage (PostgreSQL) | Each of the 3 PostgreSQL-backed services has its own isolated database with 3+ tables. Spring Data JPA for ORM. |
| Graph Storage (Neo4j) | Space Missions Service stores the full space missions graph. Nodes: Mission, Agency, Rocket, CelestialBody. Relationships: LAUNCHED, TARGETED, USED, COLLABORATED_WITH. |
| Graph Analytics (GDS) | Neo4j Graph Data Science plugin runs PageRank, Louvain, NodeSimilarity and WCC on the missions graph to uncover agency influence, mission clusters and network connectivity. |
| 3D Frontend (React) | Three.js solar system, CesiumJS Earth globe, 3d-force-graph mission network visualisation. Consumes all services through the API Gateway. |

---

## 2. Microservices Architecture

### 2.1 System Architecture Diagram

```
[ React Frontend / Postman ]
        ↓ HTTPS
API Gateway (Spring Cloud Gateway + Security + JWT)
        ↓ routes to ↓
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Celestial Body  │  Threat Tracker  │ Observer/Mission │  Alert & Event   │
│    Service      │ Service (Neo4j)  │     Service      │     Service      │
│   PostgreSQL    │      Neo4j       │   PostgreSQL     │   PostgreSQL     │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
        ↑ All registered on Eureka Naming Server | Config from Config Server
```

Feign clients are used for inter-service communication. Observer Service calls Celestial Body Service to validate body IDs. Alert Service calls Threat Tracker to scan for new threats.

---

### 2.2 Service 1: Celestial Body Service

| Property | Value |
|---|---|
| Port | 8081 |
| Database | PostgreSQL — celestial_db |
| External API | Solar System OpenData API (api.le-systeme-solaire.net) — no key required |
| Feign client exposes | GET /bodies/{id} — used by Observer Service |

#### Database Schema — celestial_db

| Table | Key Fields | Description |
|---|---|---|
| body | id, name, body_type, mass, radius, mean_temp, discovered_by | All solar system bodies |
| orbital_data | id, body_id (FK), semi_major_axis, period_days, eccentricity, inclination, velocity_km_s | Keplerian orbital elements |
| physical_properties | id, body_id (FK), gravity, escape_speed, rotation_period, axial_tilt, surface_pressure | Physical characteristics |
| moon | id, body_id (FK), parent_id (FK), name, discovery_year | Natural satellites linked to parent body |

#### REST Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /bodies | List all bodies with pagination + filter by type |
| GET | /bodies/{id} | Get single body with full telemetry |
| GET | /bodies/{id}/moons | Get all moons of a given body |
| GET | /bodies/search?name= | Search by name |
| POST | /bodies/seed | Seed database from Solar System OpenData API (admin only) |
| GET | /bodies/stats | Aggregated stats — count by type, average mass etc. |

---

### 2.3 Service 2: Threat Tracker Service (Neo4j — Shared with NoSQL Project)

> This is the Space Missions Service (port 8082). Its Neo4j database is the same instance used by the graph analytics layer described in Section 4.

| Property | Value |
|---|---|
| Port | 8082 |
| Database | Neo4j — threat_graph |
| External API | JPL SBDB API + JPL CAD API (no key required) |
| Feign client exposes | GET /threats/scan/{planetName} — used by Alert Service |

#### Neo4j Graph Schema

| Node Label | Key Properties | Description |
|---|---|---|
| SmallBody | id, name, designation, body_type (asteroid/comet), diameter_km, hazardous (boolean), abs_magnitude | Asteroids and comets from JPL SBDB |
| Planet | name, semi_major_axis_au, body_id (FK to PostgreSQL) | Solar system planets — links back to Celestial Body Service |
| CloseApproach | id, date, distance_au, velocity_km_s, uncertainty | A recorded or predicted close approach event |
| OrbitFamily | name (Apollo, Aten, Amor, Atira) | NEO orbital classification group |

| Relationship | Between | Properties |
|---|---|---|
| APPROACHES | SmallBody → Planet | via CloseApproach node; date, distance_au |
| THREATENS | SmallBody → Planet | distance_au < 0.05 AND hazardous = true |
| BELONGS_TO | SmallBody → OrbitFamily | orbital family classification |
| SHARES_CORRIDOR | SmallBody ↔ SmallBody | two bodies approach the same planet within 30 days |

#### REST Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /threats/neo | All NEOs with hazard flag + approach data |
| GET | /threats/approaches?planet=Earth | Close approaches filtered by target planet |
| GET | /threats/network/{bodyName} | Full threat network graph for a small body (nodes + edges) |
| GET | /threats/scan/{planetName} | Scan for active threats to a planet — used by Alert Service via Feign |
| GET | /threats/hazardous | All currently hazardous objects sorted by approach distance |
| POST | /threats/seed | Seed Neo4j from JPL APIs (admin) |

---

### 2.4 Service 3: Observer & Mission Service

| Property | Value |
|---|---|
| Port | 8083 |
| Database | PostgreSQL — observer_db |
| Feign calls | Celestial Body Service — validates body IDs on watchlist creation |

#### Database Schema — observer_db

| Table | Key Fields | Description |
|---|---|---|
| observer | id, username, email, role, created_at | Registered users / operators |
| mission | id, observer_id, name, target_body_id, status, start_date, notes | User-defined tracking missions |
| watchlist_entry | id, observer_id, body_id, alert_threshold_au, created_at | Bodies being watched with alert distance |
| observation_log | id, observer_id, body_id, observed_at, notes, data_json | Free-form observation records |

#### Complex Operations (Beyond CRUD)

- `POST /missions/{id}/activate` — validates body still exists via Feign call to Celestial Body Service, sets mission status, logs activation event
- `GET /observers/{id}/threat-summary` — aggregates all watchlist entries, calls Threat Tracker via Feign for each body, returns combined threat level per observer
- `GET /missions/active/report` — joins missions + observation logs + body data for a full mission status report across all active observers

---

### 2.5 Service 4: Alert & Event Service

| Property | Value |
|---|---|
| Port | 8084 |
| Database | PostgreSQL — alert_db |
| Feign calls | Threat Tracker Service — scans for active threats |
| Feign calls | Observer Service — fetches all active watchlists to match against threats |

#### Database Schema — alert_db

| Table | Key Fields | Description |
|---|---|---|
| alert | id, body_id, planet_name, distance_au, severity (LOW/MED/HIGH/CRITICAL), status, created_at | Generated threat alerts |
| notification | id, alert_id, observer_id, sent_at, channel, message | Alert notifications sent to specific observers |
| event_log | id, event_type, source_service, payload_json, timestamp | System-wide event audit log |
| alert_rule | id, observer_id, body_id, max_distance_au, min_severity, active | Per-observer configurable alert rules |

#### Complex Operations (Beyond CRUD)

- `POST /alerts/scan` — scheduled job (every 6 hours): calls Threat Tracker Feign, fetches all watchlists from Observer Service, generates new alerts if threats match, sends notifications. This is the main complex non-CRUD operation.
- `GET /alerts/dashboard` — aggregated stats: active alerts by severity, trend over past 30 days, most threatened planets
- `POST /alerts/{id}/escalate` — escalates severity, triggers additional notifications, logs escalation chain

---

### 2.6 Infrastructure Services

| Service | Port | Notes |
|---|---|---|
| Eureka Naming Server | 8761 | All 4 domain services + API Gateway register here. Enables load balancing and service discovery via Feign. |
| Config Server | 8888 | Serves application.yml configs from Git repo. Can be omitted for Docker deployment (use env vars instead). |
| API Gateway | 8080 | Spring Cloud Gateway. Handles JWT auth, route filtering, CORS. All external traffic enters here. |

### 2.7 API Gateway — Security

- Spring Security with JWT token validation
- Two roles: `ROLE_ADMIN` (full access) and `ROLE_OBSERVER` (read-only on most endpoints, write on own missions/watchlists)
- Public endpoints: `POST /auth/register`, `POST /auth/login` — served directly from Gateway
- All other routes require valid Bearer token in Authorization header
- Route configuration in application.yml: each service gets a path prefix (`/bodies/**`, `/threats/**`, `/observers/**`, `/alerts/**`)

### 2.8 Validation & Error Handling

Applied across all services:

- Bean Validation on all DTOs: `@NotNull`, `@NotBlank`, `@Min`, `@Max`, `@Email`, `@Positive` where applicable
- Custom exception classes per service: `BodyNotFoundException`, `ThreatScanException`, `ObserverNotFoundException`, etc.
- Global `@ControllerAdvice` in each service returning structured JSON error responses: `{ timestamp, status, error, message, path }`
- Feign error decoder: handles 404/500 from called services gracefully, wraps in local exception
- Idempotent seed endpoints: calling `POST /bodies/seed` twice does not create duplicates (upsert logic)

---

## 3. Docker Configuration

The entire platform runs in Docker. Each service has its own Dockerfile, and a single docker-compose.yml starts the full stack including all databases.

### 3.1 Dockerfile Pattern (each service)

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

> Run `mvn clean package -DskipTests` inside `backend/` before building Docker images. The Dockerfile copies `target/*.jar` — this file must exist first.

### 3.2 docker-compose.yml Services

| Service | Port | Dependencies / Notes |
|---|---|---|
| postgres-celestial | 5432 | PostgreSQL container for Celestial Body Service |
| postgres-observer | 5433 | PostgreSQL container for Observer Service |
| postgres-alert | 5434 | PostgreSQL container for Alert Service |
| neo4j | 7474/7687 | Neo4j container with GDS plugin. Env: `NEO4J_PLUGINS=["graph-data-science"]` |
| naming-server | 8761 | Start first. Others depend_on this. |
| config-server | 8888 | Optional for Docker. Can replace with env vars. |
| celestial-body-service | 8081 | Depends on postgres-celestial, naming-server |
| threat-tracker-service | 8082 | Depends on neo4j, naming-server |
| observer-service | 8083 | Depends on postgres-observer, naming-server |
| alert-service | 8084 | Depends on postgres-alert, naming-server |
| api-gateway | 8080 | Depends on all 4 services + naming-server. Last to start. |

> Config Server can be fully omitted in Docker. Instead, pass configuration as environment variables in docker-compose.yml (`spring.datasource.url` etc.). This is simpler and avoids the Config Server startup order problem.

---

## 4. Space Missions — Graph Analytics

The Space Missions microservice uses Neo4j as its database. The dataset covers every recorded space mission from 1957 to present, sourced from a publicly available CSV dataset on Kaggle.

### 4.1 Dataset

| Property | Details |
|---|---|
| Source | Kaggle: 'All Space Missions from 1957' (agirlcoding) — single CSV download, no API key required |
| Original data scraped from | nextspaceflight.com/launches/past |
| Dataset size | ~4,600 missions, ~70 agencies, ~180 rockets, 9 celestial body targets |
| Key CSV fields | Company, Location, Date, Detail (mission name), Rocket_Status, Price, Mission_Status |
| Import method | Spring Boot seed endpoint reads the CSV (stored in resources/), parses with OpenCSV, transforms to Neo4j nodes and relationships via Spring Data Neo4j |

### 4.2 Graph Schema

#### Nodes

| Node Label | Key Properties | Description |
|---|---|---|
| Mission | id, name, date, status (Success/Failure/Partial), cost_usd | A single space mission launch |
| Agency | name, country, type (Government/Private) | Organisation that conducted the mission |
| Rocket | name, status (Active/Retired), cost_per_launch_usd | Launch vehicle used |
| CelestialBody | name, type (Planet/Moon/Asteroid/Station) | Target destination of the mission |

#### Relationships

| Relationship | Between | Properties |
|---|---|---|
| LAUNCHED | Agency → Mission | launch_date, launch_site |
| USED | Mission → Rocket | (none — existence of relationship is the data) |
| TARGETED | Mission → CelestialBody | mission_type (Orbiter/Lander/Flyby/Crewed) |
| COLLABORATED_WITH | Agency ↔ Agency | via: mission_name, year — derived when two agencies both launched missions to the same target in the same year |
| SUCCEEDED_BY | Rocket → Rocket | when a rocket platform was replaced by a newer model |

#### Cypher Constraints & Indexes

```cypher
CREATE CONSTRAINT FOR (m:Mission) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT FOR (a:Agency) REQUIRE a.name IS UNIQUE;
CREATE CONSTRAINT FOR (r:Rocket) REQUIRE r.name IS UNIQUE;
CREATE INDEX FOR (m:Mission) ON (m.status);
CREATE INDEX FOR (m:Mission) ON (m.date);
CREATE INDEX FOR (a:Agency) ON (a.country);
```

### 4.3 Exploratory Cypher Queries

| # | Research Question | Cypher |
|---|---|---|
| 1 | Which agencies launched the most missions? | `MATCH (a:Agency)-[:LAUNCHED]->(m) RETURN a.name, count(m) AS total ORDER BY total DESC LIMIT 15` |
| 2 | What is the mission success rate per agency? | `MATCH (a)-[:LAUNCHED]->(m) RETURN a.name, count(m) AS total, sum(CASE m.status WHEN 'Success' THEN 1 ELSE 0 END) AS successes` |
| 3 | Which rockets have been used on the most missions? | `MATCH (m:Mission)-[:USED]->(r:Rocket) RETURN r.name, count(m) AS missions ORDER BY missions DESC LIMIT 10` |
| 4 | Which celestial bodies have been targeted most? | `MATCH (m)-[:TARGETED]->(b:CelestialBody) RETURN b.name, count(m) AS missions ORDER BY missions DESC` |
| 5 | Find agencies that targeted the same body in the same year | `MATCH (a1)-[:LAUNCHED]->(m1)-[:TARGETED]->(b)<-[:TARGETED]-(m2)<-[:LAUNCHED]-(a2) WHERE a1 <> a2 AND m1.date = m2.date RETURN a1.name, a2.name, b.name LIMIT 20` |
| 6 | How has mission frequency changed per decade? | `MATCH (m:Mission) RETURN (toInteger(m.date)/10)*10 AS decade, count(m) AS missions ORDER BY decade` |
| 7 | Which agencies have the most diverse rocket usage? | `MATCH (a)-[:LAUNCHED]->(m)-[:USED]->(r) RETURN a.name, count(DISTINCT r) AS rockets ORDER BY rockets DESC` |
| 8 | Find all missions in a 3-hop chain: agency → mission → rocket → mission | `MATCH path=(a:Agency)-[:LAUNCHED]->()-[:USED]->(r:Rocket)<-[:USED]-()-[:LAUNCHED]-(a2) WHERE a <> a2 RETURN a.name, r.name, a2.name LIMIT 20` |

### 4.4 Graph Data Science Algorithms

Project the graph before running algorithms, then drop the projection when done.

#### 4.4.1 Centrality — PageRank on Agency Network

**Research question:** Which space agencies are most influential in the global space exploration network, measured by their connections to missions, rockets, and other agencies?

```cypher
CALL gds.graph.project('missionGraph',
  ['Agency','Mission','Rocket','CelestialBody'],
  ['LAUNCHED','USED','TARGETED','COLLABORATED_WITH']);

CALL gds.pageRank.stream('missionGraph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS entity, score
ORDER BY score DESC LIMIT 20;
```

**Interpretation:** High PageRank agencies are the most central actors in space exploration history — not just by raw mission count but by how connected they are to other agencies, rockets, and targets. NASA and Roscosmos are expected to dominate, but private agencies like SpaceX rising in rank would confirm the commercialisation shift in the data.

#### 4.4.2 Community Detection — Louvain on Mission Clusters

**Research question:** Do space missions naturally cluster into distinct eras or geopolitical blocs based on which agencies and rockets were involved?

```cypher
CALL gds.louvain.stream('missionGraph')
YIELD nodeId, communityId
RETURN communityId, count(*) AS size,
  collect(gds.util.asNode(nodeId).name)[0..5] AS sample_members
ORDER BY size DESC LIMIT 10;
```

**Interpretation:** Communities are expected to reflect the Cold War space race (NASA/US cluster vs Roscosmos/Soviet cluster), the modern commercial era (SpaceX, RocketLab, etc.), and national emerging space programs (ISRO, CNSA, ESA). Validating whether Louvain communities align with agency country or historical era is the key analytical finding.

#### 4.4.3 Similarity — Node Similarity on Agencies

**Research question:** Which pairs of agencies are most similar in terms of which rockets they use and which celestial bodies they target?

```cypher
CALL gds.graph.project('agencySim',
  ['Agency','CelestialBody'], 'TARGETED');

CALL gds.nodeSimilarity.stream('agencySim')
YIELD node1, node2, similarity
RETURN gds.util.asNode(node1).name AS agency_a,
       gds.util.asNode(node2).name AS agency_b, similarity
ORDER BY similarity DESC LIMIT 15;
```

**Interpretation:** High-similarity agency pairs share overlapping mission portfolios — they target the same bodies with comparable scope. Identifying these pairs reveals potential natural collaboration partners and competitive dynamics in the space industry.

#### 4.4.4 Connectivity — Weakly Connected Components

**Research question:** Is the space missions graph one connected network or are there isolated clusters of agencies and missions that never intersect?

```cypher
CALL gds.wcc.stream('missionGraph')
YIELD nodeId, componentId
RETURN componentId, count(*) AS size
ORDER BY size DESC LIMIT 10;
```

**Interpretation:** A single dominant component containing most agencies confirms the interconnected nature of global space exploration. Small isolated components likely represent short-lived national programs with only a handful of missions and no shared rockets or targets. The ratio of nodes in the main component vs total nodes measures overall graph cohesion.

### 4.5 REST Endpoints — Space Missions Service

| Method | Path | Description |
|---|---|---|
| POST | /missions/seed | Import CSV dataset into Neo4j. Idempotent — safe to run multiple times. |
| GET | /missions | All missions with pagination, filter by status/agency/year |
| GET | /missions/{id} | Single mission with full graph context (agency, rocket, target) |
| GET | /agencies | All agencies with mission count and success rate |
| GET | /agencies/{name}/missions | All missions launched by a given agency |
| GET | /agencies/{name}/network | Agency's full graph neighbourhood — used by 3d-force-graph frontend |
| GET | /rockets | All rockets with usage stats |
| GET | /targets | All celestial body targets with mission counts per agency |
| GET | /analytics/pagerank | Returns top 20 PageRank results (pre-computed on seed) |
| GET | /analytics/communities | Returns Louvain community assignments for all agencies |

---

## 5. Frontend — MILANKOVIC Dashboard

Built with React + Three.js, consumes all four microservices through the API Gateway.

### 5.1 View Structure

| View | Library | Data Source |
|---|---|---|
| 3D Solar System | Three.js | Celestial Body Service + Threat Tracker (asteroid trajectories) |
| 3D Earth + Flights | CesiumJS (free tier) | OpenSky Network API (live) + Observer Service (missions) |
| Threat Network Graph | 3d-force-graph | Threat Tracker Service — nodes/edges from Neo4j |
| Telemetry Panel | Custom CSS | All services via REST through API Gateway |
| Alert Feed | Custom CSS | Alert Service (polling or WebSocket) |

> CesiumJS requires a free API token from cesium.com (Cesium ion free tier: 5GB storage, 100GB streaming/month). Register before starting frontend work.

### 5.2 Aesthetic Direction

- Color palette: pitch black void (`#020408`), cold blue accents (`#00B4FF`), electric teal highlights (`#00FF96`), amber NEO alerts (`#FF8C00`)
- Typography: Orbitron (headings / data values), Share Tech Mono (labels / coordinates), Exo 2 (body text)
- UI panels: semi-transparent dark glass with hairline borders, corner bracket decorations, scan-line animation overlays
- Motion: orbital paths animated in real-time, pulsing threat indicators, live waveform for signal monitoring
- Earth: NASA Blue Marble day texture + night city lights texture, atmospheric glow shader, cloud layer

---

## 6. Recommended Build Order

Follow this order strictly. Each phase is independently demonstrable. Never start Docker until all services run locally.

### Phase 1 — Foundation (Week 1)
1. Create Maven parent project with modules: naming-server, config-server, api-gateway, celestial-body-service, threat-tracker-service, observer-service, alert-service
2. Set up Eureka Naming Server (`spring-cloud-starter-netflix-eureka-server`). Verify dashboard at localhost:8761
3. Set up Config Server (`spring-cloud-config-server`). Point to local Git repo or use application.yml directly.
4. Register all services on Eureka. Verify all appear on dashboard before adding any business logic.

### Phase 2 — Celestial Body Service (Week 1-2)
5. Set up PostgreSQL database (celestial_db). Configure Spring Data JPA entities and repositories.
6. Implement seed endpoint: fetch from Solar System OpenData API, transform JSON, persist to DB.
7. Implement all REST endpoints. Test with Postman.
8. Add Bean Validation + global exception handler.

### Phase 3 — Space Missions Service + Neo4j (Week 2-3)
9. Set up Neo4j (local or Docker). Add `spring-data-neo4j` dependency. Configure connection.
10. Define Neo4j entity classes with `@Node`, `@Relationship` annotations: Mission, Agency, Rocket, CelestialBody.
11. Implement seed endpoint: reads missions.csv from `src/main/resources/`, parses with OpenCSV, builds graph.
12. Implement REST endpoints. Run and screenshot GDS algorithm queries for the analytics report.

### Phase 4 — Observer + Alert Services (Week 3)
13. Build Observer Service with PostgreSQL. Implement Feign client to call Celestial Body Service.
14. Build Alert Service. Implement Feign clients to Threat Tracker + Observer Service.
15. Implement the scan job in Alert Service (the main complex operation).

### Phase 5 — API Gateway + Security (Week 3-4)
16. Configure Spring Cloud Gateway routes for all services.
17. Add Spring Security with JWT: login/register endpoints, token generation, filter chain.
18. Test full flow: register → login → receive token → call protected endpoints.

### Phase 6 — Docker (Week 4)
19. Write Dockerfile for each service. Test individual builds.
20. Write docker-compose.yml with all services, databases, and health checks.
21. Run `docker compose up` and verify full system starts. Test all endpoints against port 8080.
22. Push Docker images to Docker Hub. Save image URLs in a txt file.

### Phase 7 — NoSQL Report + Frontend (Week 4-5)
23. Run all 8 exploratory Cypher queries. Screenshot results.
24. Run all 4 GDS algorithms. Screenshot results and write interpretations.
25. Write the graph analytics report (see Section 4).
26. Build React frontend — connects all services into the live MILANKOVIC dashboard.

---

## 7. Technology Summary

### Microservices Layer

| Component | Technology |
|---|---|
| Domain services | 4 Spring Boot services, each with its own database and independently deployable |
| Relational persistence | PostgreSQL (celestial_db, observer_db, alert_db) via Spring Data JPA |
| Graph persistence | Neo4j via Spring Data Neo4j — Space Missions Service |
| Inter-service calls | Spring Cloud OpenFeign with Eureka service discovery |
| Service discovery | Spring Cloud Netflix Eureka — all services register on startup |
| Centralised config | Spring Cloud Config Server (Git-backed) |
| Security | Spring Cloud Gateway + Spring Security + JWT |
| Containerisation | Docker + docker-compose — full stack in one command |

### Graph Analytics Layer (NoSQL Project)

| Component | What the Grader Looks For |
|---|---|
| Dataset & Graph Modeling | Real dataset, meaningful nodes and relationships, proper constraints and indexes, schema justification |
| Cypher Exploration | Variety of queries: filtering, aggregations, pattern matching, path traversal. Results interpreted in domain context. |
| GDS Algorithms | At least one from each category: centrality, community detection, similarity, connectivity. Correct graph projection used. |
| Result Interpretation | Algorithm outputs interpreted in domain context — PageRank mapped to agency influence, Louvain communities mapped to Cold War vs modern era. |
| Analytical Thinking | Research questions defined upfront, findings confirm or challenge initial hypotheses, domain conclusions drawn. |

---

## 8. Project Checklist

### 8.1 Microservices Checklist

- [ ] ZIP archive containing all project modules (naming-server, config-server, api-gateway, 4 services)
- [ ] Run `mvn clean` on all modules before zipping — no /target folders, no compiled .class or .jar files
- [ ] txt file containing Docker Hub image URLs for each service (except Config Server)
- [ ] docker-compose.yml file in the ZIP root
- [ ] Final verification: `docker compose up` starts cleanly, all services appear on Eureka at localhost:8761, all endpoints respond via port 8080
- [ ] Postman collection covers the full user story: register → login → seed data → create mission → trigger alert scan → view results

### 8.2 Graph Analytics Checklist

- [ ] Analytics report covers: dataset description, graph schema with justification, all Cypher queries with result screenshots, GDS algorithm runs with interpretations, domain conclusions
- [ ] Seed endpoint is idempotent and rebuilds the full graph from the CSV in one call
- [ ] Screenshots of Neo4j Browser showing graph visualisation
- [ ] Cypher script file with all exploratory queries and GDS calls

### 8.3 Demo Tips

- Prepare a Postman collection that walks through the full user story: register → login → seed data → create mission → trigger alert scan → view mission network. Practice until the flow takes under 10 minutes.
- Know every part of the codebase — be ready to explain any class, annotation, or design decision.
- For the graph demo: open Neo4j Browser, have the mission network visualisation ready, and run one GDS query live.
- Keep the frontend running in a browser tab — even if not graded, it makes an enormous visual impression during the 15 minutes.
