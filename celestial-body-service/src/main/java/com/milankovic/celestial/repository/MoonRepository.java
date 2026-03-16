package com.milankovic.celestial.repository;

import com.milankovic.celestial.entity.Moon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MoonRepository extends JpaRepository<Moon, String> {

    List<Moon> findByBodyId(String bodyId);

    List<Moon> findByParentId(String parentId);
}