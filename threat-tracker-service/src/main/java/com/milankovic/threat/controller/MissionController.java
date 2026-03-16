package com.milankovic.threat.controller;

import com.milankovic.threat.entity.Agency;
import com.milankovic.threat.entity.Mission;
import com.milankovic.threat.repository.AgencyRepository.AgencyStats;
import com.milankovic.threat.repository.AgencyRepository.CollaborationEdge;
import com.milankovic.threat.repository.MissionRepository.MissionSummary;
import com.milankovic.threat.repository.RocketRepository;
import com.milankovic.threat.repository.SpaceCelestialBodyRepository;
import com.milankovic.threat.service.AgencyService;
import com.milankovic.threat.service.AnalyticsService;
import com.milankovic.threat.service.MissionService;
import com.milankovic.threat.service.MissionSeedService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class MissionController {

    private final MissionService missionService;
    private final AgencyService agencyService;
    private final RocketRepository rocketRepository;
    private final SpaceCelestialBodyRepository celestialBodyRepository;
    private final MissionSeedService seedService;
    private final AnalyticsService analyticsService;

    public MissionController(MissionService missionService, AgencyService agencyService,
                              RocketRepository rocketRepository, SpaceCelestialBodyRepository celestialBodyRepository,
                              MissionSeedService seedService, AnalyticsService analyticsService) {
        this.missionService = missionService;
        this.agencyService = agencyService;
        this.rocketRepository = rocketRepository;
        this.celestialBodyRepository = celestialBodyRepository;
        this.seedService = seedService;
        this.analyticsService = analyticsService;
    }

    @PostMapping("/missions/seed")
    public ResponseEntity<Map<String, Object>> seed() throws Exception {
        int count = seedService.seed();
        try { analyticsService.projectGraph(); } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("seeded", count));
    }

    @GetMapping("/missions")
    public ResponseEntity<Page<Mission>> getMissions(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(missionService.findAll(status, pageable));
    }

    @GetMapping("/missions/summary")
    public ResponseEntity<List<MissionSummary>> getMissionSummaries() {
        return ResponseEntity.ok(missionService.findAllSummaries());
    }

    @GetMapping("/missions/{id}")
    public ResponseEntity<Mission> getMissionById(@PathVariable String id) {
        return missionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/agencies")
    public ResponseEntity<List<AgencyStats>> getAgencies() {
        return ResponseEntity.ok(agencyService.findAllWithMissionCount());
    }

    @GetMapping("/agencies/collaborations")
    public ResponseEntity<List<CollaborationEdge>> getCollaborations() {
        return ResponseEntity.ok(agencyService.findCollaborations());
    }

    @GetMapping("/agencies/{name}/missions")
    public ResponseEntity<List<Mission>> getAgencyMissions(@PathVariable String name) {
        return ResponseEntity.ok(agencyService.findMissionsByAgency(name));
    }

    @GetMapping("/agencies/{name}/network")
    public ResponseEntity<Agency> getAgencyNetwork(@PathVariable String name) {
        return agencyService.findById(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/rockets")
    public ResponseEntity<List<?>> getRockets() {
        return ResponseEntity.ok(rocketRepository.findAllWithUsageCount());
    }

    @GetMapping("/targets")
    public ResponseEntity<List<?>> getTargets() {
        return ResponseEntity.ok(celestialBodyRepository.findAllWithMissionCount());
    }

    @GetMapping("/targets/{name}/missions")
    public ResponseEntity<List<Mission>> getTargetMissions(@PathVariable String name) {
        return ResponseEntity.ok(missionService.findByTargetBody(name));
    }

    @GetMapping("/analytics/pagerank")
    public ResponseEntity<List<Map<String, Object>>> getPageRank() {
        return ResponseEntity.ok(analyticsService.getPageRank());
    }

    @GetMapping("/analytics/agency-communities")
    public ResponseEntity<List<Map<String, Object>>> getAgencyCommunities() {
        return ResponseEntity.ok(analyticsService.getAgencyCommunities());
    }

    @GetMapping("/analytics/communities")
    public ResponseEntity<List<Map<String, Object>>> getCommunities() {
        return ResponseEntity.ok(analyticsService.getCommunities());
    }

    @GetMapping("/analytics/similarity")
    public ResponseEntity<List<Map<String, Object>>> getSimilarity() {
        return ResponseEntity.ok(analyticsService.getSimilarity());
    }

    @GetMapping("/analytics/connectivity")
    public ResponseEntity<List<Map<String, Object>>> getConnectivity() {
        return ResponseEntity.ok(analyticsService.getConnectivity());
    }

    @PostMapping("/analytics/project")
    public ResponseEntity<Map<String, String>> projectGraph() {
        analyticsService.projectGraph();
        return ResponseEntity.ok(Map.of("status", "projected"));
    }
}
