package com.sweng.backend.config;

import com.sweng.backend.auth.JwtAuthenticationFilter;
import com.sweng.backend.user.CustomUserDetailsService;
import java.util.Arrays;
import java.util.List;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/** Configuration class for Spring Security. */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  private final CustomUserDetailsService userDetailsService;
  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  /**
   * Constructs a SecurityConfig with required dependencies.
   *
   * @param userDetailsService the user details service
   * @param jwtAuthenticationFilter the JWT authentication filter
   */
  public SecurityConfig(
      CustomUserDetailsService userDetailsService,
      JwtAuthenticationFilter jwtAuthenticationFilter) {
    this.userDetailsService = userDetailsService;
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
  }

  /**
   * Provides a password encoder bean.
   *
   * @return the password encoder
   */
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /**
   * Provides a DAO authentication provider bean configured with the custom user details service and
   * password encoder.
   *
   * @return the authentication provider
   */
  @Bean
  public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder());
    return authProvider;
  }

  /**
   * Provides an authentication manager bean backed by the DAO authentication provider.
   *
   * @return the authentication manager
   */
  @Bean
  public AuthenticationManager authenticationManager() {
    return new ProviderManager(authenticationProvider());
  }

  /**
   * Provides a CORS configuration source bean.
   *
   * <p>Permits requests from {@code http://localhost:3000} with credentials, allows standard HTTP
   * methods and headers, and caches preflight responses for one hour.
   *
   * @return the CORS configuration source
   */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("http://localhost:3000"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowedHeaders(
        Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "X-Requested-With",
            "Cache-Control"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  /**
   * Configures the security filter chain.
   *
   * <p>Disables CSRF and form-based login, enforces stateless session management, and defines
   * authorization rules per HTTP method and path. The JWT authentication filter is inserted before
   * the standard username/password filter.
   *
   * @param http the HTTP security configuration
   * @return the security filter chain
   * @throws Exception if configuration fails
   */
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(CorsUtils::isPreFlightRequest)
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/register")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/login")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/logout")
                    .authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/auth/me")
                    .authenticated()
                    .requestMatchers("/api/auth/**")
                    .permitAll()
                    .requestMatchers("/actuator/**", "/error")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/server-info")
                    .permitAll()
                    .requestMatchers("/favicon.ico")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/upload/**")
                    .authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/highscores", "/api/highscores/all")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/highscores")
                    .authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/restaurants")
                    .permitAll()
                    .requestMatchers(HttpMethod.DELETE, "/api/restaurants")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/restaurants/{restaurantId}")
                    .permitAll()
                    .requestMatchers(HttpMethod.PATCH, "/api/restaurants", "/api/restaurants/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.PUT, "/api/orders")
                    .permitAll()
                    .requestMatchers(HttpMethod.DELETE, "/api/orders")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/orders/{orderId}")
                    .permitAll()
                    .requestMatchers(HttpMethod.PATCH, "/api/orders", "/api/orders/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/restaurants", "/api/restaurants/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/restaurants")
                    .authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/restaurants/**")
                    .authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/restaurants/**")
                    .authenticated()
                    .requestMatchers(HttpMethod.GET, "/api/orders", "/api/orders/**")
                    .authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/orders")
                    .authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/orders/**")
                    .authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/orders/**")
                    .authenticated()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                    .accessDeniedHandler(
                        (req, res, e) -> res.setStatus(HttpStatus.FORBIDDEN.value())))
        .formLogin(form -> form.disable())
        .httpBasic(basic -> basic.disable())
        .authenticationProvider(authenticationProvider())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  /**
   * Prevents JwtAuthenticationFilter from being auto-registered as a servlet filter. It should only
   * run within the Spring Security filter chain.
   *
   * @param filter the JWT authentication filter
   * @return the filter registration bean with registration disabled
   */
  @Bean
  public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(
      JwtAuthenticationFilter filter) {
    FilterRegistrationBean<JwtAuthenticationFilter> registration =
        new FilterRegistrationBean<>(filter);
    registration.setEnabled(false);
    return registration;
  }
}
