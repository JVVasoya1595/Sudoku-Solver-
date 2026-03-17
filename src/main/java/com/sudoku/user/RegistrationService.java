package com.sudoku.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class RegistrationService {

    private final AppUserRepository repo;
    private final PasswordEncoder encoder;

    public RegistrationService(AppUserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public void registerUser(String username, String rawPassword) {
        if (repo.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        String hash = encoder.encode(rawPassword);
        repo.save(new AppUser(username, hash, "USER"));
    }
}
