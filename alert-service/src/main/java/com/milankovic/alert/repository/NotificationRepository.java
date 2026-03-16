package com.milankovic.alert.repository;

import com.milankovic.alert.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByObserverId(Long observerId);
    List<Notification> findByAlertId(Long alertId);
}
