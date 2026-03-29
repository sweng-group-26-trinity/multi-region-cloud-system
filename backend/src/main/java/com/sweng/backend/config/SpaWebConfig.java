package com.sweng.backend.config;

import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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

/** Configuration class for serving static frontend and documentation sites. */
@Configuration
@Controller
/** Configuration class for serving the frontend SPA. */
@Configuration
@Controller
public class SpaWebConfig implements WebMvcConfigurer {

  /** Default constructor. */
  public SpaWebConfig() {}

  @Value("${frontend.path:${FRONTEND_PATH:}}")
  private String frontendPath;

  @Value("${documentation.path:${DOCUMENTATION_PATH:}}")
  private String documentationPath;

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

  /**
   * Serves index.html for the /docs root path. Same empty-path workaround as serveRoot().
   *
   * @return the docs index.html resource as an HTML response
   */
  @GetMapping("/docs")
  @ResponseBody
  public ResponseEntity<Resource> serveDocsRoot() {
    if (documentationPath == null || documentationPath.isBlank()) {
      return ResponseEntity.notFound().build();
    }
    Resource index = new FileSystemResource(documentationPath + "/index.html");
    if (!index.exists()) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(index);
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Docs handler — registered before /** so it takes priority over the SPA resolver.
    // Uses DocsResourceResolver: serves index.html for directories, 404 for missing files.
    if (documentationPath != null && !documentationPath.isBlank()) {
      registry
          .addResourceHandler("/docs/**")
          .addResourceLocations("file:" + documentationPath + "/")
          .resourceChain(true)
          .addResolver(new DocsResourceResolver());
    }

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
   * Security filter chain for frontend and documentation paths. Permits all requests to non-API,
   * non-actuator paths so that static assets are publicly accessible. Only active when either
   * FRONTEND_PATH or DOCUMENTATION_PATH is non-blank; falls back to matching nothing otherwise.
   *
   * @param http the HTTP security builder
   * @return the configured security filter chain
   * @throws Exception if configuration fails
   */
  @Bean
  @Order(0)
  @ConditionalOnBean(HttpSecurity.class)
  public SecurityFilterChain spaSecurityFilterChain(HttpSecurity http) throws Exception {
    boolean hasFrontend = frontendPath != null && !frontendPath.isBlank();
    boolean hasDocs = documentationPath != null && !documentationPath.isBlank();
    if (!hasFrontend && !hasDocs) {
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

  /**
   * Resolver for documentation static files. Handles directory paths by serving index.html, but
   * does not provide SPA fallback for non-existent paths (returns 404 instead).
   */
  private static class DocsResourceResolver extends PathResourceResolver {

    @Override
    protected Resource getResource(String resourcePath, Resource location) throws IOException {
      Resource resource = super.getResource(resourcePath, location);
      if (resource != null) {
        return resource;
      }

      // Try appending index.html for directory paths
      if (!resourcePath.endsWith("/")) {
        resource = super.getResource(resourcePath + "/index.html", location);
      } else {
        resource = super.getResource(resourcePath + "index.html", location);
      }

      return resource;
    }
  }
}
