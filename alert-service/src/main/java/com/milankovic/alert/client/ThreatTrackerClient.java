package com.milankovic.alert.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "threat-tracker-service")
public interface ThreatTrackerClient {

    @GetMapping("/threats/scan/{planetName}")
    List<Map<String, Object>> scanThreats(@PathVariable("planetName") String planetName);
}
