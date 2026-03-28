package com.sweng.backend.auth;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.sweng.backend.user.Role;
import com.sweng.backend.user.User;
import com.sweng.backend.user.UserRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
class LoginResponseIT {

  @Autowired WebApplicationContext context;
  @Autowired UserRepository userRepository;
  @Autowired org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

  private MockMvc mockMvc;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @BeforeEach
  void setup() {
    this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

    userRepository.deleteAll();
    User user =
        new User(
            UUID.randomUUID(),
            "testuser",
            "test@example.com",
            passwordEncoder.encode("testpassword123"),
            OffsetDateTime.now());
    user.getRoles().add(Role.CUSTOMER);
    userRepository.save(user);
  }

  @Test
  void loginResponse_containsAllExpectedFields() throws Exception {
    String loginJson =
        "{" + "\"identifier\": \"testuser\"," + "\"password\": \"testpassword123\"" + "}";

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").exists())
            .andExpect(jsonPath("$.tokenType").exists())
            .andExpect(jsonPath("$.expiresIn").exists())
            .andExpect(jsonPath("$.user").exists())
            .andExpect(jsonPath("$.user.id").exists())
            .andExpect(jsonPath("$.user.username").exists())
            .andExpect(jsonPath("$.user.email").exists())
            .andReturn();

    String responseBody = result.getResponse().getContentAsString();
    JsonNode json = objectMapper.readTree(responseBody);

    org.junit.jupiter.api.Assertions.assertFalse(
        json.isEmpty(), "Login response should not be empty");
    org.junit.jupiter.api.Assertions.assertNotNull(
        json.get("accessToken"), "accessToken should be present");
    org.junit.jupiter.api.Assertions.assertTrue(
        json.get("accessToken").asText().length() > 0, "accessToken should not be empty");

    System.out.println("Login Response: " + responseBody);
    System.out.println("Access Token: " + json.get("accessToken").asText());
    System.out.println("Token Type: " + json.get("tokenType").asText());
    System.out.println("Expires In: " + json.get("expiresIn").asInt());
    System.out.println("User ID: " + json.get("user").get("id").asText());
    System.out.println("Username: " + json.get("user").get("username").asText());
    System.out.println("Email: " + json.get("user").get("email").asText());
  }

  @Test
  void loginResponse_withInvalidCredentials_returns401() throws Exception {
    String loginJson =
        "{" + "\"identifier\": \"testuser\"," + "\"password\": \"wrongpassword\"" + "}";

    mockMvc
        .perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginJson))
        .andExpect(status().isUnauthorized())
        .andExpect(content().string("Invalid username or password"));
  }

  @Test
  void loginResponse_invalidRequestFormat_returns400() throws Exception {
    String invalidJson = "{\"identifier\": \"testuser\"}";

    mockMvc
        .perform(
            post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(invalidJson))
        .andExpect(status().isBadRequest());
  }
}
