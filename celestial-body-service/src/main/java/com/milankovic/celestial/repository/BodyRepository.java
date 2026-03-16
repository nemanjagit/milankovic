package com.milankovic.celestial.repository;

import com.milankovic.celestial.entity.Body;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BodyRepository extends JpaRepository<Body, String> {

    Page<Body> findByBodyType(String bodyType, Pageable pageable);

    Optional<Body> findByNameIgnoreCase(String name);

    List<Body> findByNameContainingIgnoreCase(String name);

    @Query("SELECT b.bodyType, COUNT(b) FROM Body b GROUP BY b.bodyType")
    List<Object[]> countByBodyType();

    @Query("SELECT AVG(b.mass) FROM Body b WHERE b.mass IS NOT NULL")
    Double averageMass();
}