package com.milankovic.threat.controller;

import com.milankovic.threat.entity.SmallBody;
import com.milankovic.threat.service.ThreatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/threats")
public class ThreatController {

    private final ThreatService threatService;

    public ThreatController(ThreatService threatService) {
        this.threatService = threatService;
    }

    @GetMapping("/neo")
    public ResponseEntity<List<SmallBody>> getAllNeos() {
        return ResponseEntity.ok(threatService.getAllNeos());
    }

    @GetMapping("/hazardous")
    public ResponseEntity<List<SmallBody>> getHazardous() {
        return ResponseEntity.ok(threatService.getHazardous());
    }

    @GetMapping("/approaches")
    public ResponseEntity<List<SmallBody>> getApproaches(@RequestParam String planet) {
        return ResponseEntity.ok(threatService.getApproachesByPlanet(planet));
    }

    @GetMapping("/network/{bodyName}")
    public ResponseEntity<List<SmallBody>> getNetwork(@PathVariable String bodyName) {
        return ResponseEntity.ok(threatService.getNetworkForBody(bodyName));
    }

    @GetMapping("/scan/{planetName}")
    public ResponseEntity<List<Map<String, Object>>> scan(@PathVariable String planetName) {
        return ResponseEntity.ok(threatService.scanThreatsWithDistance(planetName));
    }

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seed() {
        int count = threatService.seedThreats();
        return ResponseEntity.ok(Map.of("seeded", count));
    }
}
