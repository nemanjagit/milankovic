package com.milankovic.observer.exception;

public class ObserverNotFoundException extends RuntimeException {
    public ObserverNotFoundException(Long id) {
        super("Observer not found: " + id);
    }
}
