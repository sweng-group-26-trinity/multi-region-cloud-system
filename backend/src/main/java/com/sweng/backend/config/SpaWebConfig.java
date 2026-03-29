package com.sweng.backend.config;

import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/** Configuration class for serving the frontend SPA. */
@Configuration
@Controller
public class SpaWebConfig implements WebMvcConfigurer {

  /** Default constructor. */
  public SpaWebConfig() {}

  @Value("${frontend.path:${FRONTEND_PATH:}}")
  private String frontendPath;

  /**
   * Serves index.html for the root path. Spring's ResourceHttpRequestHandler strips the leading
   * slash from "/" leaving an empty path and returns 404 before calling any resolver, so the root
   * path requires an explicit controller mapping.
   *
   * @return the index.html resource as an HTML response
   */
  @GetMapping("/")
  @ResponseBody
  public ResponseEntity<Resource> serveRoot() {
    if (frontendPath == null || frontendPath.isBlank()) {
      return ResponseEntity.notFound().build();
    }
    Resource index = new FileSystemResource(frontendPath + "/index.html");
    if (!index.exists()) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(index);
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    if (frontendPath == null || frontendPath.isBlank()) {
      return;
    }

    registry
        .addResourceHandler("/**")
        .addResourceLocations("file:" + frontendPath + "/")
        .resourceChain(true)
        .addResolver(new SpaResourceResolver());
  }

  /**
   * Security filter chain for frontend paths. Permits all requests to non-API, non-actuator paths
   * so that static assets and SPA routes are publicly accessible. Only active when FRONTEND_PATH is
   * set to a non-blank value; falls back to matching nothing otherwise.
   *
   * @param http the HTTP security builder
   * @return the configured security filter chain
   * @throws Exception if configuration fails
   */
  @Bean
  @Order(0)
  @ConditionalOnBean(HttpSecurity.class)
  public SecurityFilterChain spaSecurityFilterChain(HttpSecurity http) throws Exception {
    if (frontendPath == null || frontendPath.isBlank()) {
      http.securityMatcher(request -> false);
      http.authorizeHttpRequests(auth -> auth.anyRequest().denyAll());
      return http.build();
    }
    http.securityMatcher(
            request -> {
              String path = request.getRequestURI();
              return !path.startsWith("/api/")
                  && !path.startsWith("/actuator/")
                  && !path.equals("/error");
            })
        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
        .csrf(csrf -> csrf.disable())
        .formLogin(form -> form.disable())
        .httpBasic(basic -> basic.disable());
    return http.build();
  }

  private static class SpaResourceResolver extends PathResourceResolver {

    @Override
    protected Resource getResource(String resourcePath, Resource location) throws IOException {
      Resource resource = super.getResource(resourcePath, location);
      if (resource != null) {
        return resource;
      }

      String lastSegment =
          resourcePath.contains("/")
              ? resourcePath.substring(resourcePath.lastIndexOf('/') + 1)
              : resourcePath;

      if (lastSegment.contains(".")) {
        return null;
      }

      return super.getResource("index.html", location);
    }
  }
}
