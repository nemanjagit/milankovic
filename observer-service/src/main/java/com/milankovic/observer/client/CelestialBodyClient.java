package com.milankovic.observer.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "celestial-body-service")
public interface CelestialBodyClient {

    @GetMapping("/bodies/{id}")
    Map<String, Object> getBodyById(@PathVariable("id") String id);
}
