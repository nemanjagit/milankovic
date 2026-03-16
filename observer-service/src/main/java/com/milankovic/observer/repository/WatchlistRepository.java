package com.milankovic.observer.repository;

import com.milankovic.observer.entity.WatchlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WatchlistRepository extends JpaRepository<WatchlistEntry, Long> {
    List<WatchlistEntry> findByObserverId(Long observerId);
    List<WatchlistEntry> findByBodyId(String bodyId);
}
