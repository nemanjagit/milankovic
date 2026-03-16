package com.milankovic.alert.repository;

import com.milankovic.alert.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByStatus(String status);

    List<Alert> findByBodyIdAndStatus(String bodyId, String status);

    boolean existsByBodyIdAndPlanetNameAndStatus(String bodyId, String planetName, String status);

    @Query("SELECT a.severity, COUNT(a) FROM Alert a WHERE a.status = 'OPEN' GROUP BY a.severity")
    List<Object[]> countBySeverity();

    @Query("SELECT a.planetName, COUNT(a) FROM Alert a WHERE a.status = 'OPEN' GROUP BY a.planetName ORDER BY COUNT(a) DESC")
    List<Object[]> mostThreatenedPlanets();

    List<Alert> findByCreatedAtAfter(Instant since);
}
