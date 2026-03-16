package com.milankovic.threat.service;

import com.milankovic.threat.entity.Mission;
import com.milankovic.threat.repository.MissionRepository;
import com.milankovic.threat.repository.MissionRepository.MissionSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MissionService {

    private final MissionRepository missionRepository;

    public MissionService(MissionRepository missionRepository) {
        this.missionRepository = missionRepository;
    }

    public Page<Mission> findAll(String status, Pageable pageable) {
        return missionRepository.findByFilters(status, pageable);
    }

    public Optional<Mission> findById(String id) {
        return missionRepository.findById(id);
    }

    public List<MissionSummary> findAllSummaries() {
        return missionRepository.findAllSummaries();
    }

    public List<Mission> findByTargetBody(String targetName) {
        return missionRepository.findByTargetBody(targetName);
    }
}
