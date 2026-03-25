package com.sweng.backend.auth;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.sweng.backend.config.RestTemplateConfig;
import com.sweng.backend.user.CustomUserDetailsService;
import com.sweng.backend.user.Role;
import com.sweng.backend.user.User;
import com.sweng.backend.user.UserRepository;
import com.sweng.backend.user.UserService;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(AuthController.class)
@Import(RestTemplateConfig.class)
class AuthControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @MockitoBean private AuthenticationManager authenticationManager;

  @MockitoBean private UserService userService;

  @MockitoBean private JwtUtil jwtUtil;

  @MockitoBean private UserRepository userRepository;

  @MockitoBean private PasswordEncoder passwordEncoder;

  @MockitoBean private CustomUserDetailsService customUserDetailsService;

  @Autowired private RestTemplate restTemplate;

  private User testUser;
  private String testJwtToken;
  private MockRestServiceServer mockServer;

  @BeforeEach
  void setUp() {
    UUID userId = UUID.randomUUID();
    testUser =
        new User(
            userId, "testuser", "testuser@example.com", "hashedPassword", OffsetDateTime.now());
    testUser.getRoles().add(Role.CUSTOMER);

    testJwtToken = "mocked.jwt.token";

    mockServer = MockRestServiceServer.createServer(restTemplate);
  }

  @AfterEach
  void tearDown() {
    mockServer.verify();
  }

  @Test
  void googleAuth_success_createsUserAndReturnsToken() throws Exception {
    stubTokenInfo("valid_google_id_token", "testuser@example.com");
    when(userService.findOrCreateGoogleUser(anyString())).thenReturn(testUser);
    when(jwtUtil.generateToken(anyString())).thenReturn(testJwtToken);

    String requestJson = googleAuthRequestJson("valid_google_id_token");

    mockMvc
        .perform(
            post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content(requestJson))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").value(testJwtToken))
        .andExpect(jsonPath("$.expiresIn").value(86400))
        .andExpect(jsonPath("$.user.id").value(testUser.getUid().toString()))
        .andExpect(jsonPath("$.user.username").value("testuser"))
        .andExpect(jsonPath("$.user.email").value("testuser@example.com"));
  }

  @Test
  void googleAuth_invalidToken_returns401() throws Exception {
    stubTokenInfo("invalid_google_id_token", "testuser@example.com");
    when(userService.findOrCreateGoogleUser(anyString()))
        .thenThrow(new RuntimeException("Invalid Google token"));

    String requestJson = googleAuthRequestJson("invalid_google_id_token");

    mockMvc
        .perform(
            post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content(requestJson))
        .andExpect(status().isUnauthorized())
        .andExpect(content().string("Google authentication failed"));
  }

  @Test
  void googleAuth_missingIdToken_returns400() throws Exception {
    String requestJson = googleAuthRequestJson("");

    mockMvc
        .perform(
            post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content(requestJson))
        .andExpect(status().isBadRequest());
  }

  @Test
  void googleAuth_userAlreadyExists_returnsExistingUserToken() throws Exception {
    User existingUser =
        new User(
            UUID.randomUUID(),
            "existinguser",
            "existing@example.com",
            "hashedPassword",
            OffsetDateTime.now());
    existingUser.getRoles().add(Role.CUSTOMER);

    when(userService.findOrCreateGoogleUser(anyString())).thenReturn(existingUser);
    stubTokenInfo("another_valid_token", "existing@example.com");
    when(jwtUtil.generateToken(anyString())).thenReturn("existing.user.token");

    String requestJson = googleAuthRequestJson("another_valid_token");

    mockMvc
        .perform(
            post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content(requestJson))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").value("existing.user.token"))
        .andExpect(jsonPath("$.user.email").value("existing@example.com"));
  }

  private void stubTokenInfo(String idToken, String email) {
    mockServer
        .expect(requestTo("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken))
        .andExpect(method(HttpMethod.GET))
        .andRespond(withSuccess("{\"email\":\"" + email + "\"}", MediaType.APPLICATION_JSON));
  }

  private String googleAuthRequestJson(String idToken) throws Exception {
    GoogleAuthRequest request = new GoogleAuthRequest();
    request.setIdToken(idToken);
    return objectMapper.writeValueAsString(request);
  }
}
