package com.sweng.backend.config;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/** Integration tests for {@link SpaWebConfig} — static frontend serving and SPA fallback. */
@SpringBootTest
@ActiveProfiles("test")
class SpaWebConfigTest {

  @Autowired private WebApplicationContext context;

  private MockMvc mockMvc;

  /**
   * Sets FRONTEND_PATH to the test fixture directory before the application context loads. Uses
   * DynamicPropertySource (highest priority) to override any environment variable.
   *
   * @param registry the dynamic property registry
   */
  @DynamicPropertySource
  static void setFrontendPath(DynamicPropertyRegistry registry) {
    String path = Path.of("src/test/resources/test-frontend").toAbsolutePath().toString();
    registry.add("FRONTEND_PATH", () -> path);
  }

  @BeforeEach
  void setup() {
    this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  @Test
  void rootServesIndexHtml() throws Exception {
    mockMvc
        .perform(get("/"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("test-index")));
  }

  @Test
  void spaRouteServesIndexHtml() throws Exception {
    mockMvc
        .perform(get("/login"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("test-index")));
  }

  @Test
  void nestedSpaRouteServesIndexHtml() throws Exception {
    mockMvc
        .perform(get("/restaurants/123"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("test-index")));
  }

  @Test
  void staticFileServedDirectly() throws Exception {
    mockMvc
        .perform(get("/test-asset.js"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("console.log")));
  }

  @Test
  void staticFileInSubdirectory() throws Exception {
    mockMvc.perform(get("/public/logo.svg")).andExpect(status().isOk());
  }

  @Test
  void missingFileWithExtensionReturns404() throws Exception {
    mockMvc.perform(get("/nonexistent.js")).andExpect(status().isNotFound());
  }

  @Test
  void frontendPathsDoNotRequireAuth() throws Exception {
    mockMvc.perform(get("/")).andExpect(status().isOk());
  }

  @Test
  void apiPathsStillRequireAuth() throws Exception {
    mockMvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
  }
}
