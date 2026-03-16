package com.milankovic.alert.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "observer-service")
public interface ObserverClient {

    @GetMapping("/observers/{id}/watchlist")
    List<Map<String, Object>> getWatchlist(@PathVariable("id") Long observerId);

    @GetMapping("/observers")
    List<Map<String, Object>> getAllObservers();
}
