package com.gulfracing.config;

import com.gulfracing.repository.UserRepository;
import com.gulfracing.security.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.session.*;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.*;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder(@Value("${app.security.bcrypt-strength:12}") int strength) {
        return new BCryptPasswordEncoder(strength);
    }

    @Bean
    AuthenticationManager authenticationManager(AccountUserDetailsService users, PasswordEncoder encoder) {
        var provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new DelegatingSecurityContextRepository(
                new RequestAttributeSecurityContextRepository(),
                new HttpSessionSecurityContextRepository()
        );
    }

    @Bean
    CsrfTokenRepository csrfTokenRepository() {
        return new HttpSessionCsrfTokenRepository();
    }

    @Bean
    SessionAuthenticationStrategy loginSessionStrategy(CsrfTokenRepository csrf) {
        return new CompositeSessionAuthenticationStrategy(List.of(
                new ChangeSessionIdAuthenticationStrategy(),
                new CsrfAuthenticationStrategy(csrf)
        ));
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:5500,http://127.0.0.1:5500}")
            List<String> origins
    ) {
        var cors = new CorsConfiguration();
        cors.setAllowedOrigins(origins);
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Content-Type", "X-CSRF-TOKEN", "Accept"));
        cors.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return source;
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SecurityContextRepository contexts,
            CsrfTokenRepository csrf,
            SecurityErrorWriter errors,
            UserRepository users,
            ObjectProvider<ClientRegistrationRepository> registrations,
            GoogleOidcUserService google,
            @Value("${app.oauth2.success-url:/api/users/me}") String successUrl,
            @Value("${app.security.rate-limit-enabled:true}") boolean rateLimit
    ) throws Exception {

        http.cors(cors -> {})
                .csrf(config -> config.csrfTokenRepository(csrf))
                .securityContext(context -> context.securityContextRepository(contexts))
                .requestCache(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/csrf",
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/error"
                        ).permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/races", "/api/races/*").permitAll()
                        .requestMatchers("/api/races", "/api/races/**").hasAnyRole("ORGANIZER", "ADMIN")

                        .requestMatchers("/api/race-entries", "/api/race-entries/**")
                        .hasAnyRole("OWNER", "TRAINER", "ORGANIZER", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/race-results", "/api/race-results/*").permitAll()
                        .requestMatchers("/api/race-results", "/api/race-results/**").hasAnyRole("ORGANIZER", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/camel/**").permitAll()
                        .requestMatchers("/camel/**").hasAnyRole("OWNER", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/marketplace/**").permitAll()
                        .requestMatchers("/marketplace/**").hasAnyRole("OWNER", "ADMIN")

                        .requestMatchers("/offer/**").authenticated()

                        .requestMatchers(HttpMethod.GET, "/trainer-profile/**").permitAll()
                        .requestMatchers("/trainer-profile/**").hasAnyRole("TRAINER", "ADMIN")

                        // Ownership records are authoritative data. Public ownership changes happen
                        // through camel creation and accepted marketplace offers, not direct writes.
                        .requestMatchers("/ownershipRecord/**").hasRole("ADMIN")

                        .requestMatchers("/api/challenges/mine").authenticated()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/challenges",
                                "/api/challenges/*",
                                "/api/challenges/*/results"
                        ).permitAll()
                        .requestMatchers(
                                "/api/users/me",
                                "/api/challenges",
                                "/api/challenges/**"
                        ).authenticated()

                        .anyRequest().denyAll()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, error) ->
                                errors.write(
                                        response,
                                        401,
                                        "UNAUTHORIZED",
                                        "Authentication is required."
                                )
                        )
                        .accessDeniedHandler((request, response, error) ->
                                errors.write(
                                        response,
                                        403,
                                        "FORBIDDEN",
                                        "Access denied or CSRF token missing/invalid."
                                )
                        )
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((request, response, auth) ->
                                response.setStatus(204)
                        )
                )
                .addFilterBefore(
                        new AuthRateLimitFilter(errors, rateLimit),
                        CsrfFilter.class
                )
                .addFilterAfter(
                        new SessionAccountFilter(users, errors),
                        AnonymousAuthenticationFilter.class
                );

        if (registrations.getIfAvailable() != null) {
            http.oauth2Login(oauth -> oauth
                    .userInfoEndpoint(info -> info.oidcUserService(google))
                    .defaultSuccessUrl(successUrl, true)
                    .failureHandler((request, response, ex) ->
                            errors.write(
                                    response,
                                    401,
                                    "GOOGLE_LOGIN_FAILED",
                                    "Google sign-in could not be completed."
                            )
                    )
            );
        }

        return http.build();
    }
}
