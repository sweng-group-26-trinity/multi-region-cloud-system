package com.sweng.backend.config;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
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

@SpringBootTest
@ActiveProfiles("test")
class SpaForwardingIT {

  private static final String INDEX_HTML =
      "<!DOCTYPE html><html><body>SPA</body></html>";
  private static final String MAIN_JS = "console.log(\"test\")";

  // Initialized at class-load time so the value is available when SpringExtension
  // creates the application context (before JUnit's TempDirectory extension runs).
  static final Path tempDir;

  static {
    try {
      tempDir = Files.createTempDirectory("spa-test");
    } catch (IOException e) {
      throw new ExceptionInInitializerError(e);
    }
  }

  @Autowired WebApplicationContext context;

  private MockMvc mockMvc;

  @DynamicPropertySource
  static void setFrontendPath(DynamicPropertyRegistry registry) {
    registry.add("frontend.path", tempDir::toString);
  }

  @BeforeAll
  static void createFrontendFiles() throws IOException {
    Files.writeString(tempDir.resolve("index.html"), INDEX_HTML);

    Path assetsDir = tempDir.resolve("assets");
    Files.createDirectories(assetsDir);
    Files.writeString(assetsDir.resolve("main.js"), MAIN_JS);
  }

  @AfterAll
  static void cleanupTempDir() throws IOException {
    try (var stream = Files.walk(tempDir)) {
      stream.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
    }
  }

  @BeforeEach
  void setup() {
    this.mockMvc =
        MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  @Test
  void spaRouteServesIndexHtml() throws Exception {
    mockMvc
        .perform(get("/login"))
        .andExpect(status().isOk())
        .andExpect(content().string(INDEX_HTML));
  }

  @Test
  void nestedSpaRouteServesIndexHtml() throws Exception {
    mockMvc
        .perform(get("/some/nested/route"))
        .andExpect(status().isOk())
        .andExpect(content().string(INDEX_HTML));
  }

  @Test
  void staticAssetServedDirectly() throws Exception {
    mockMvc
        .perform(get("/assets/main.js"))
        .andExpect(status().isOk())
        .andExpect(content().string(MAIN_JS));
  }

  @Test
  void apiRouteNotIntercepted() throws Exception {
    mockMvc
        .perform(get("/api/restaurants"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").exists());
  }
}
