package com.milankovic.celestial.exception;

public class BodyNotFoundException extends RuntimeException {
    public BodyNotFoundException(String id) {
        super("Celestial body not found: " + id);
    }
}