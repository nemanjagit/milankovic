# MILANKOVIC - Space Intelligence Platform

A full-stack space intelligence platform that tracks celestial bodies, near-Earth objects, and the complete history of human space exploration. Built as a Spring Boot microservices backend with a Neo4j graph analytics layer, all running in a single Docker stack with a 3D React frontend.

> Covers two college projects: Distributed Systems (microservices architecture) and NoSQL Databases (graph analytics with Neo4j GDS).

---

## 🛰️ What It Does

MILANKOVIC pulls together real astronomical data from multiple public APIs and presents it through an interactive 3D dashboard:

- **3D Solar System** - a live Three.js solar system rendered with real orbital mechanics. Click any body to see its physical and orbital properties. Asteroids and NEOs are plotted with real trajectories.
- **Satellite Tracker** - real-time satellite positions rendered on a 3D Earth globe. Satellites are grouped by category (ISS & stations, Starlink, GPS, weather). Click any satellite to see its orbital path.
- **Threat Monitor** - near-Earth objects pulled from NASA's JPL database, categorised by how close they pass Earth. Objects within 0.05 AU are flagged as hazardous and tracked with `THREATENS` relationships in Neo4j.
- **Mission Network** - ~4,600 space missions from 1957 to present, modelled as a graph in Neo4j. Explore agency networks, mission timelines, rocket usage, and collaboration clusters powered by GDS algorithms.
- **Alert Feed** - automatically generated alerts for any threatening NEO. Each alert carries a severity (LOW / MED / HIGH / CRITICAL) based on approach distance, and can be escalated manually.
- **Observers & Missions** - users can register as observers, build watchlists of bodies they care about, and create tracking missions with activation workflows.

---

## 🏗️ Architecture

```
[ React Frontend ]
       ↓
API Gateway :8080  (JWT auth, routing)
       ↓
┌──────────────────┬───────────────────┬──────────────────┬─────────────────┐
│ Celestial Body   │  Threat Tracker   │    Observer      │     Alert       │
│    :8081         │     :8082         │     :8083        │     :8084       │
│  PostgreSQL      │     Neo4j         │  PostgreSQL      │  PostgreSQL     │
└──────────────────┴───────────────────┴──────────────────┴─────────────────┘
       ↑ All registered on Eureka Naming Server :8761
```

Services communicate via Feign. The API Gateway handles all JWT authentication and route filtering. Config Server is available at :8888.

---

## 🔧 Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 · Spring Boot 3 · Spring Cloud |
| Relational DB | PostgreSQL (3 isolated instances) |
| Graph DB | Neo4j 5 + Graph Data Science plugin |
| API | Spring Cloud Gateway · Eureka · Feign · JWT |
| Frontend | React + TypeScript · Three.js · Vite |
| Infrastructure | Docker · docker-compose |

---

## 📦 Services

### Celestial Body Service (:8081)
The source of truth for solar system bodies. On first boot, seeds ~515 bodies from the Solar System OpenData API - planets, moons, asteroids, comets - each with full orbital elements and physical properties. The frontend's 3D solar system and body detail panels are driven entirely by this service.

### Threat Tracker Service (:8082)
Dual-purpose service. On the threat side, it pulls close approach data from NASA's JPL CAD API (~24k approach records) and builds a Neo4j graph of `SmallBody → APPROACHES/THREATENS → Planet` relationships. On the missions side, it seeds ~4,600 historical space missions into a separate Neo4j graph and exposes GDS analytics endpoints (PageRank, Louvain, NodeSimilarity, WCC) over that graph.

### Observer Service (:8083)
Handles user-facing operations: creating observers, managing watchlists of bodies they want to track, and defining tracking missions. When an observer creates a watchlist entry, this service calls Celestial Body Service via Feign to validate the body exists. A `threat-summary` endpoint aggregates threat levels across all entries in an observer's watchlist.

### Alert Service (:8084)
Scans for threats every 6 hours by calling Threat Tracker via Feign. For each threatening NEO, it checks whether an open alert already exists and creates one if not, then notifies all registered observers. Provides a dashboard with counts by severity and 30-day trend. Alerts can be manually escalated through the UI.

---

## 🚀 Running the Project

### Prerequisites
- Docker Desktop

### Start

```bash
docker-compose up
```

Once running, open **http://localhost** in your browser.

All services start automatically. On first boot, seeding runs in the background:
- Celestial bodies seed from the Solar System OpenData API
- Space missions + NEO threats seed from JPL APIs (Neo4j - takes a few minutes)
- Alerts generate automatically once threats are ready (~90s retry loop)

### Stop (data persists)

```bash
docker-compose down
```

Data lives in named Docker volumes and survives restarts. Only `docker-compose down -v` wipes everything.

### Rebuild after code changes

```bash
docker-compose up --build
```

---

## 🌐 Access

| Service | URL |
|---|---|
| Frontend | http://localhost |
| API Gateway | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |
| Neo4j Browser | http://localhost:7474 |

### Authentication

A default admin account is available on first boot:

| Username | Password |
|---|---|
| `admin` | `admin123` |

All protected endpoints require `Authorization: Bearer <token>`.

---

## 🖥️ Frontend

The frontend is a single-page React app served on port 80. Navigation is on the left sidebar - views load lazily on first visit and stay mounted after that (no re-fetching on tab switch).

| View | What you see |
|---|---|
| **Dashboard** | Live stats bar - total bodies, missions, open alerts. Overview cards. |
| **Solar System** | Interactive 3D solar system. Click a body to open its telemetry panel on the right. Scroll to zoom, drag to orbit. |
| **Satellites** | 3D Earth with live satellite positions. Toggle categories (ISS, Starlink, GPS, Weather) from the right panel. Click a satellite to see its orbit path. |
| **Threats** | Force-directed graph of the NEO threat network - bodies, planets, and relationships. Filter by hazardous, sort by distance. |
| **Missions** | Space mission explorer. Browse by agency, filter by status/year. Agency network graphs show collaboration clusters. |
| **Alerts** | Active threat alerts with severity breakdown. Filter by severity, paginate through records. Escalate alerts from the table. |
| **Observers** | Observer management - register observers, manage watchlists and tracking missions. |

---

## 🔑 Key Endpoints

| Method | Path | Description |
|---|---|---|
| GET | /bodies | All celestial bodies (paginated, filter by type) |
| GET | /bodies/{id} | Single body with full orbital + physical data |
| GET | /threats/scan/Earth | Active threats approaching Earth |
| GET | /threats/hazardous | All hazardous NEOs sorted by distance |
| GET | /missions | All space missions (paginated) |
| GET | /agencies | All agencies with mission stats |
| GET | /analytics/pagerank | Top agencies by PageRank score |
| GET | /analytics/communities | Louvain community assignments |
| GET | /alerts/dashboard | Alert counts by severity + 30-day trend |
| POST | /threats/seed | Re-seed Neo4j from JPL APIs (admin) |
| POST | /alerts/scan | Trigger a manual threat scan (admin) |

---

## 🧠 Graph Analytics (Neo4j GDS)

The missions graph covers ~4,600 space missions from 1957 to present across ~70 agencies, ~180 rockets, and 9 celestial body targets.

| Algorithm | Purpose |
|---|---|
| **PageRank** | Measures agency influence across the global space network - not just by mission count but by how connected each agency is to others |
| **Louvain** | Community detection - surfaces natural clusters like the Cold War space race blocs vs the modern commercial era |
| **NodeSimilarity** | Finds agency pairs with overlapping mission portfolios - same rockets, same targets |
| **WCC** | Connectivity analysis - confirms whether the missions graph is one cohesive network or contains isolated program clusters |

---

## 📁 Project Structure

```
milankovic/
├── api-gateway/
├── naming-server/
├── config-server/
├── celestial-body-service/
├── threat-tracker-service/
├── observer-service/
├── alert-service/
├── frontend/
├── docker-compose.yml
└── pom.xml
```