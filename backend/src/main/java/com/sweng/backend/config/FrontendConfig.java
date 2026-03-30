package com.sweng.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.lang.Nullable;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.web.servlet.resource.ResourceResolverChain;

/**
 * Configuration for serving the frontend SPA from a local filesystem path.
 *
 * <p>Static assets (paths whose last segment contains a {@code .}) are served directly. Any other
 * path that does not match an existing file falls back to {@code index.html} so that client-side
 * routing works. API and actuator routes are handled by their own controllers and never reach this
 * resource handler.
 */
@Configuration
@ConditionalOnProperty(name = "frontend.path")
public class FrontendConfig implements WebMvcConfigurer {

  private final String frontendPath;

  /**
   * Constructs a FrontendConfig with the configured frontend path.
   *
   * @param frontendPath the filesystem path to the frontend build output
   */
  public FrontendConfig(@Value("${frontend.path:}") String frontendPath) {
    this.frontendPath = frontendPath;
  }

  /**
   * Registers a resource handler that serves static files from the frontend build directory, with
   * SPA fallback to {@code index.html} for routes without a file extension.
   *
   * @param registry the resource handler registry
   */
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry
        .addResourceHandler("/**")
        .addResourceLocations("file:" + frontendPath + "/")
        .resourceChain(true)
        .addResolver(new SpaFallbackResolver());
  }

  /**
   * Resolves resources from the filesystem, falling back to {@code index.html} for paths that have
   * no file extension (SPA client-side routes). Paths with a file extension that do not correspond
   * to an existing file resolve to {@code null}, resulting in a 404.
   */
  private static final class SpaFallbackResolver extends PathResourceResolver {

    @Override
    @Nullable
    protected Resource resolveResourceInternal(
        @Nullable HttpServletRequest request,
        String requestPath,
        List<? extends Resource> locations,
        ResourceResolverChain chain) {
      Resource resource = super.resolveResourceInternal(request, requestPath, locations, chain);
      if (resource != null) {
        return resource;
      }
      if (!requestPath.contains(".")) {
        return super.resolveResourceInternal(request, "index.html", locations, chain);
      }
      return null;
    }
  }
}
