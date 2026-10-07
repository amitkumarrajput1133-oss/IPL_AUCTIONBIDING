package com.ipl.auction.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final TokenUtil tokenUtil;

    public SecurityConfig(TokenUtil tokenUtil) {
        this.tokenUtil = tokenUtil;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/", "/health", "/api/health").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/ws-auction/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auction/active/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/players/*/sell", "/api/players/*/unsold").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/bids").hasAnyRole("TEAM_OWNER", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(new TokenAuthenticationFilter(tokenUtil), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}