package com.milankovic.observer.repository;

import com.milankovic.observer.entity.ObserverMission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MissionRepository extends JpaRepository<ObserverMission, Long> {
    List<ObserverMission> findByObserverId(Long observerId);
    List<ObserverMission> findByStatus(String status);

    @Query("SELECT m FROM ObserverMission m WHERE m.status = 'ACTIVE'")
    List<ObserverMission> findAllActive();
}
