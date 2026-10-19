package com.gulfracing.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class TrainerPhotoWebConfig implements WebMvcConfigurer {
    private final String photoLocation;

    public TrainerPhotoWebConfig(@Value("${app.upload-dir:uploads}") String uploadDirectory) {
        String location = Path.of(uploadDirectory).toAbsolutePath().normalize()
                .resolve("trainer-profiles").toUri().toString();
        this.photoLocation = location.endsWith("/") ? location : location + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/trainer-profiles/**")
                .addResourceLocations(photoLocation);
    }
}
