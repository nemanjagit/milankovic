package com.milankovic.observer.service;

import com.milankovic.observer.client.CelestialBodyClient;
import com.milankovic.observer.client.ThreatTrackerClient;
import com.milankovic.observer.entity.ObservationLog;
import com.milankovic.observer.entity.Observer;
import com.milankovic.observer.entity.ObserverMission;
import com.milankovic.observer.entity.WatchlistEntry;
import com.milankovic.observer.exception.MissionNotFoundException;
import com.milankovic.observer.exception.ObserverNotFoundException;
import com.milankovic.observer.repository.*;
import feign.FeignException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ObserverService {

    private final ObserverRepository observerRepository;
    private final MissionRepository missionRepository;
    private final WatchlistRepository watchlistRepository;
    private final ObservationLogRepository observationLogRepository;
    private final CelestialBodyClient celestialBodyClient;
    private final ThreatTrackerClient threatTrackerClient;

    public ObserverService(ObserverRepository observerRepository, MissionRepository missionRepository,
                           WatchlistRepository watchlistRepository, ObservationLogRepository observationLogRepository,
                           CelestialBodyClient celestialBodyClient, ThreatTrackerClient threatTrackerClient) {
        this.observerRepository = observerRepository;
        this.missionRepository = missionRepository;
        this.watchlistRepository = watchlistRepository;
        this.observationLogRepository = observationLogRepository;
        this.celestialBodyClient = celestialBodyClient;
        this.threatTrackerClient = threatTrackerClient;
    }

    // --- Observers ---
    public List<Observer> getAllObservers() { return observerRepository.findAll(); }

    public Observer getObserver(Long id) {
        return observerRepository.findById(id).orElseThrow(() -> new ObserverNotFoundException(id));
    }

    public Observer createObserver(Observer observer) { return observerRepository.save(observer); }

    public void deleteObserver(Long id) {
        if (!observerRepository.existsById(id)) throw new ObserverNotFoundException(id);
        observerRepository.deleteById(id);
    }

    // --- Missions ---
    public List<ObserverMission> getMissionsByObserver(Long observerId) {
        if (!observerRepository.existsById(observerId)) throw new ObserverNotFoundException(observerId);
        return missionRepository.findByObserverId(observerId);
    }

    public ObserverMission createMission(ObserverMission mission) {
        if (!observerRepository.existsById(mission.getObserverId())) {
            throw new ObserverNotFoundException(mission.getObserverId());
        }
        return missionRepository.save(mission);
    }

    @Transactional
    public ObserverMission activateMission(Long missionId) {
        ObserverMission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new MissionNotFoundException(missionId));

        // Validate body still exists via Feign
        if (mission.getTargetBodyId() != null) {
            try {
                celestialBodyClient.getBodyById(mission.getTargetBodyId());
            } catch (FeignException.NotFound e) {
                throw new IllegalStateException("Target body no longer exists: " + mission.getTargetBodyId());
            }
        }

        mission.setStatus("ACTIVE");
        missionRepository.save(mission);

        // Log activation
        ObservationLog log = new ObservationLog();
        log.setObserverId(mission.getObserverId());
        log.setBodyId(mission.getTargetBodyId());
        log.setObservedAt(Instant.now());
        log.setNotes("Mission activated: " + mission.getName());
        observationLogRepository.save(log);

        return mission;
    }

    public List<Map<String, Object>> getActiveMissionReport() {
        List<ObserverMission> active = missionRepository.findAllActive();
        List<Map<String, Object>> report = new ArrayList<>();
        for (ObserverMission m : active) {
            Map<String, Object> entry = new java.util.HashMap<>();
            entry.put("mission", m);
            if (m.getTargetBodyId() != null) {
                try {
                    entry.put("body", celestialBodyClient.getBodyById(m.getTargetBodyId()));
                } catch (FeignException e) {
                    entry.put("body", Map.of("error", "unavailable"));
                }
            }
            List<ObservationLog> logs = observationLogRepository.findByBodyId(m.getTargetBodyId());
            entry.put("recentLogs", logs.stream().limit(5).toList());
            report.add(entry);
        }
        return report;
    }

    // --- Watchlist ---
    public List<WatchlistEntry> getWatchlist(Long observerId) {
        if (!observerRepository.existsById(observerId)) throw new ObserverNotFoundException(observerId);
        return watchlistRepository.findByObserverId(observerId);
    }

    @Transactional
    public WatchlistEntry addToWatchlist(WatchlistEntry entry) {
        if (!observerRepository.existsById(entry.getObserverId())) {
            throw new ObserverNotFoundException(entry.getObserverId());
        }
        // Validate body exists
        celestialBodyClient.getBodyById(entry.getBodyId());
        return watchlistRepository.save(entry);
    }

    public void removeFromWatchlist(Long entryId) { watchlistRepository.deleteById(entryId); }

    public Map<String, Object> getThreatSummary(Long observerId) {
        List<WatchlistEntry> watchlist = getWatchlist(observerId);
        List<Map<String, Object>> threats = new ArrayList<>();
        for (WatchlistEntry entry : watchlist) {
            try {
                List<Map<String, Object>> bodyThreats = threatTrackerClient.scanThreats("Earth");
                threats.addAll(bodyThreats);
            } catch (FeignException e) {
                threats.add(Map.of("bodyId", entry.getBodyId(), "error", "threat service unavailable"));
            }
        }
        return Map.of("observerId", observerId, "watchlistSize", watchlist.size(), "threats", threats);
    }
}
