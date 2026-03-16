package com.milankovic.observer.repository;

import com.milankovic.observer.entity.Observer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ObserverRepository extends JpaRepository<Observer, Long> {
    Optional<Observer> findByUsername(String username);
    boolean existsByEmail(String email);
}
