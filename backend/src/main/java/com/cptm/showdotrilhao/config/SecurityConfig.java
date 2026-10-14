package com.cptm.showdotrilhao.config;

import com.cptm.showdotrilhao.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final String allowedOriginsStr;
    private final String activeProfile;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8080}") String allowedOriginsStr,
            @Value("${spring.profiles.active:dev}") String activeProfile) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.allowedOriginsStr = allowedOriginsStr;
        this.activeProfile = activeProfile;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Rotas públicas (Auth, Swagger, H2 console, Visitante, Rankings, Health e verificação de sala)
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/health", "/actuator/**").permitAll()
                        .requestMatchers("/salas/public/**").permitAll()
                        .requestMatchers("/salas/{codigo}/entrar-visitante").permitAll()
                        .requestMatchers("/salas/{codigo}/estado-jogador").permitAll()
                        .requestMatchers("/salas/{codigo}/responder-simbolo").permitAll()
                        .requestMatchers("/partidas/visitante/**").permitAll()
                        .requestMatchers("/partidas/{id}/responder").permitAll()
                        .requestMatchers("/partidas/{id}/abandonar").permitAll()
                        .requestMatchers("/partidas/{id}/status").permitAll()
                        .requestMatchers("/ranking/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()

                        // Rotas de controle da sala pelo Apresentador / Admin
                        .requestMatchers("/salas/{codigo}/iniciar").hasAnyRole("APRESENTADOR", "ADMIN")
                        .requestMatchers("/salas/{codigo}/revelar").hasAnyRole("APRESENTADOR", "ADMIN")
                        .requestMatchers("/salas/{codigo}/proxima").hasAnyRole("APRESENTADOR", "ADMIN")
                        .requestMatchers("/salas/{codigo}/estado-apresentador").hasAnyRole("APRESENTADOR", "ADMIN")
                        .requestMatchers("/salas/apresentador/**").hasAnyRole("APRESENTADOR", "ADMIN")
                        .requestMatchers("/perguntas/gestao/**").hasAnyRole("APRESENTADOR", "ADMIN")

                        // Rotas exclusivas de Admin
                        .requestMatchers("/usuarios/**").hasRole("ADMIN")

                        // Demais rotas exigem autenticação
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> patterns = new ArrayList<>();

        if ("prod".equalsIgnoreCase(activeProfile)) {
            // Em produção, rigorosamente apenas as origens explicitamente configuradas (Firebase)
            if (allowedOriginsStr != null && !allowedOriginsStr.isBlank()) {
                for (String origin : allowedOriginsStr.split(",")) {
                    String trimmed = origin.trim();
                    if (!trimmed.isEmpty() && !patterns.contains(trimmed)) {
                        patterns.add(trimmed);
                    }
                }
            }
        } else {
            // Em desenvolvimento, permite origens locais e curingas para testes
            patterns.add("http://localhost:*");
            patterns.add("http://127.0.0.1:*");
            patterns.add("https://*.web.app");
            patterns.add("https://*.firebaseapp.com");

            if (allowedOriginsStr != null && !allowedOriginsStr.isBlank()) {
                for (String origin : allowedOriginsStr.split(",")) {
                    String trimmed = origin.trim();
                    if (!trimmed.isEmpty() && !patterns.contains(trimmed)) {
                        patterns.add(trimmed);
                    }
                }
            }
        }

        configuration.setAllowedOriginPatterns(patterns);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
