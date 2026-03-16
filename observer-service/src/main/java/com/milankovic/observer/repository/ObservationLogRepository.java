package com.milankovic.observer.repository;

import com.milankovic.observer.entity.ObservationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ObservationLogRepository extends JpaRepository<ObservationLog, Long> {
    List<ObservationLog> findByObserverId(Long observerId);
    List<ObservationLog> findByBodyId(String bodyId);
}
