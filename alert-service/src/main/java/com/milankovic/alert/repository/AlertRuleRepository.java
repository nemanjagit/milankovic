package com.milankovic.alert.repository;

import com.milankovic.alert.entity.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    List<AlertRule> findByObserverId(Long observerId);
    List<AlertRule> findByActive(Boolean active);
}
