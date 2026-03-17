package com.sudoku.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.sudoku.user.AppUser;
import com.sudoku.user.AppUserRepository;

@Configuration
public class UserSeedConfig {

    @Bean
    public ApplicationRunner seedDefaultUser(
            AppUserRepository repo,
            PasswordEncoder encoder,
            @Value("${app.auth.username:admin}") String username,
            @Value("${app.auth.password:admin123}") String password
    ) {
        return args -> {
            if (!repo.existsByUsername(username)) {
                repo.save(new AppUser(username, encoder.encode(password), "USER"));
            }
        };
    }
}
