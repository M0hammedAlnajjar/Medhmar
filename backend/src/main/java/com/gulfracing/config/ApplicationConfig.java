package com.gulfracing.config;

import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.EnableAsync;
import java.security.SecureRandom;
import java.time.Clock;

@Configuration
@EnableAsync
public class ApplicationConfig {
    @Bean
    Clock clock() { return Clock.systemUTC(); }
    @Bean
    SecureRandom secureRandom() { return new SecureRandom(); }
}
