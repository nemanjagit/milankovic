package com.milankovic.celestial;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class CelestialBodyServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CelestialBodyServiceApplication.class, args);
    }
}