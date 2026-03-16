package com.milankovic.threat.service;

import com.milankovic.threat.entity.Agency;
import com.milankovic.threat.entity.Mission;
import com.milankovic.threat.repository.AgencyRepository;
import com.milankovic.threat.repository.AgencyRepository.AgencyStats;
import com.milankovic.threat.repository.AgencyRepository.CollaborationEdge;
import com.milankovic.threat.repository.MissionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AgencyService {

    private final AgencyRepository agencyRepository;
    private final MissionRepository missionRepository;

    public AgencyService(AgencyRepository agencyRepository, MissionRepository missionRepository) {
        this.agencyRepository = agencyRepository;
        this.missionRepository = missionRepository;
    }

    public List<AgencyStats> findAllWithMissionCount() {
        return agencyRepository.findAllWithMissionCount();
    }

    public List<CollaborationEdge> findCollaborations() {
        return agencyRepository.findCollaborations();
    }

    public List<Mission> findMissionsByAgency(String agencyName) {
        return missionRepository.findByAgencyName(agencyName);
    }

    public Optional<Agency> findById(String name) {
        return agencyRepository.findById(name);
    }
}
