package com.milankovic.observer.exception;

public class MissionNotFoundException extends RuntimeException {
    public MissionNotFoundException(Long id) {
        super("Mission not found: " + id);
    }
}
