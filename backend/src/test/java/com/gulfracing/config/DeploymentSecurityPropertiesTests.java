package com.gulfracing.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.*;

class DeploymentSecurityPropertiesTests {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withPropertyValues("DB_USERNAME=medhmar_limited", "DB_PASSWORD=test-only", "SESSION_COOKIE_SECURE=false");

    @Test
    void productionOverridesLocalInsecureCookieSettingAndUsesConfiguredDatabaseAccount() {
        runner.withPropertyValues("spring.profiles.active=prod").run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context.getEnvironment().getProperty("server.servlet.session.cookie.secure", Boolean.class)).isTrue();
            assertThat(context.getEnvironment().getProperty("spring.datasource.username")).isEqualTo("medhmar_limited");
        });
    }

    @Test
    void localHttpDevelopmentStillWorksWithConfiguredDatabaseAccount() {
        runner.withPropertyValues("spring.profiles.active=local").run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context.getEnvironment().getProperty("server.servlet.session.cookie.secure", Boolean.class)).isFalse();
            assertThat(context.getEnvironment().getProperty("spring.datasource.username")).isEqualTo("medhmar_limited");
        });
    }
}
