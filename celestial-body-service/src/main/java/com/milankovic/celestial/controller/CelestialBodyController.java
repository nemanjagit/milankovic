package com.milankovic.celestial.controller;

import com.milankovic.celestial.dto.BodyResponse;
import com.milankovic.celestial.dto.BodyStatsResponse;
import com.milankovic.celestial.dto.MoonResponse;
import com.milankovic.celestial.service.CelestialBodyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bodies")
public class CelestialBodyController {

    private final CelestialBodyService service;

    public CelestialBodyController(CelestialBodyService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<BodyResponse>> getAllBodies(
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.getAllBodies(type, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BodyResponse> getBodyById(@PathVariable String id) {
        return ResponseEntity.ok(service.getBodyById(id));
    }

    @GetMapping("/{id}/moons")
    public ResponseEntity<List<MoonResponse>> getMoons(@PathVariable String id) {
        return ResponseEntity.ok(service.getMoonsByBodyId(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<BodyResponse>> search(@RequestParam String name) {
        return ResponseEntity.ok(service.searchByName(name));
    }

    @GetMapping("/stats")
    public ResponseEntity<BodyStatsResponse> getStats() {
        return ResponseEntity.ok(service.getStats());
    }

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seed() {
        int count = service.seedFromApi();
        return ResponseEntity.ok(Map.of("seeded", count));
    }
}
