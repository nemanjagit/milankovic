package com.milankovic.observer.controller;

import com.milankovic.observer.entity.Observer;
import com.milankovic.observer.entity.ObserverMission;
import com.milankovic.observer.entity.WatchlistEntry;
import com.milankovic.observer.service.ObserverService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/observers")
public class ObserverController {

    private final ObserverService service;

    public ObserverController(ObserverService service) {
        this.service = service;
    }

    // --- Observers ---
    @GetMapping
    public ResponseEntity<List<Observer>> getAll() {
        return ResponseEntity.ok(service.getAllObservers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Observer> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(service.getObserver(id));
    }

    @PostMapping
    public ResponseEntity<Observer> create(@Valid @RequestBody Observer observer) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createObserver(observer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteObserver(id);
        return ResponseEntity.noContent().build();
    }

    // --- Missions ---
    @GetMapping("/{id}/missions")
    public ResponseEntity<List<ObserverMission>> getMissions(@PathVariable Long id) {
        return ResponseEntity.ok(service.getMissionsByObserver(id));
    }

    @PostMapping("/missions")
    public ResponseEntity<ObserverMission> createMission(@Valid @RequestBody ObserverMission mission) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createMission(mission));
    }

    @PostMapping("/missions/{id}/activate")
    public ResponseEntity<ObserverMission> activate(@PathVariable Long id) {
        return ResponseEntity.ok(service.activateMission(id));
    }

    @GetMapping("/missions/active/report")
    public ResponseEntity<List<Map<String, Object>>> activeMissionReport() {
        return ResponseEntity.ok(service.getActiveMissionReport());
    }

    // --- Watchlist ---
    @GetMapping("/{id}/watchlist")
    public ResponseEntity<List<WatchlistEntry>> getWatchlist(@PathVariable Long id) {
        return ResponseEntity.ok(service.getWatchlist(id));
    }

    @PostMapping("/watchlist")
    public ResponseEntity<WatchlistEntry> addToWatchlist(@Valid @RequestBody WatchlistEntry entry) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addToWatchlist(entry));
    }

    @DeleteMapping("/watchlist/{id}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable Long id) {
        service.removeFromWatchlist(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/threat-summary")
    public ResponseEntity<Map<String, Object>> threatSummary(@PathVariable Long id) {
        return ResponseEntity.ok(service.getThreatSummary(id));
    }
}
