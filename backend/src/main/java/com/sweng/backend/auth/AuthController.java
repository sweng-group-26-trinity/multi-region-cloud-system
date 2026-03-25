package com.sweng.backend.auth;

import com.sweng.backend.user.User;
import com.sweng.backend.user.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

/** REST controller for handling authentication-related requests. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final UserService userService;
  private final JwtUtil jwtUtil;
  private final RestTemplate restTemplate;

  /**
   * Constructs an AuthController with required dependencies.
   *
   * @param authenticationManager the authentication manager
   * @param userService the user service
   * @param jwtUtil the JWT utility
   * @param restTemplate the REST template for external HTTP requests
   */
  public AuthController(
      AuthenticationManager authenticationManager,
      UserService userService,
      JwtUtil jwtUtil,
      RestTemplate restTemplate) {
    this.authenticationManager = authenticationManager;
    this.userService = userService;
    this.jwtUtil = jwtUtil;
    this.restTemplate = restTemplate;
  }

  /**
   * Registers a new user.
   *
   * @param registerRequest the register request containing user details
   * @return response entity containing the created user
   */
  @PostMapping("/register")
  public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
    try {
      User user =
          userService.registerUser(
              registerRequest.getUsername(),
              registerRequest.getEmail(),
              registerRequest.getPassword());

      UserDto dto = new UserDto();
      dto.setId(user.getUid().toString());
      dto.setUsername(user.getUsername());
      dto.setEmail(user.getEmail());
      dto.setFirstName(registerRequest.getFirstName());
      dto.setLastName(registerRequest.getLastName());
      dto.setRoles(user.getRoles().stream().map(r -> r.name()).toList());
      dto.setCreatedAt(user.getCreatedAt());

      return ResponseEntity.status(201).body(dto);
    } catch (RuntimeException e) {
      String message = e.getMessage();
      if (message != null && message.contains("already exists")) {
        return ResponseEntity.status(409).body(message);
      }
      return ResponseEntity.badRequest().body(message);
    }
  }

  /**
   * Authenticates a user and returns a JWT token.
   *
   * @param loginRequest the login request containing credentials
   * @return response entity containing authentication details
   */
  @PostMapping("/login")
  public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
    try {
      String identifier = loginRequest.getIdentifier();
      String username;

      // If it looks like an email, resolve it to a username first
      if (identifier.contains("@")) {
        User user = userService.findByEmail(identifier);
        if (user == null) {
          return ResponseEntity.status(401).body("Invalid username or password");
        }
        username = user.getUsername();
      } else {
        username = identifier;
      }

      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(username, loginRequest.getPassword()));

      String jwt = jwtUtil.generateToken(username);
      User user = userService.findByUsername(username);
      LoginResponse.UserDto userDto =
          new LoginResponse.UserDto(user.getUid().toString(), user.getUsername(), user.getEmail());
      LoginResponse response = new LoginResponse(jwt, 86400, userDto);
      return ResponseEntity.ok(response);

    } catch (Exception e) {
      return ResponseEntity.status(401).body("Invalid username or password");
    }
  }

  /**
   * Gets the current authenticated user profile.
   *
   * @param authentication the current authentication
   * @return response entity containing the current user
   */
  @GetMapping("/me")
  public ResponseEntity<?> getCurrentUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(401).body("Unauthorized");
    }

    try {
      String username = authentication.getName();
      User user = userService.findByUsername(username);

      UserDto dto = new UserDto();
      dto.setId(user.getUid().toString());
      dto.setUsername(user.getUsername());
      dto.setEmail(user.getEmail());
      dto.setFirstName(null);
      dto.setLastName(null);
      dto.setRoles(user.getRoles().stream().map(r -> r.name()).toList());
      dto.setCreatedAt(user.getCreatedAt());

      return ResponseEntity.ok(dto);
    } catch (Exception e) {
      return ResponseEntity.status(401).body("Unauthorized");
    }
  }

  /**
   * Logs out the current user (client should discard token).
   *
   * @return response entity indicating logout success
   */
  @PostMapping("/logout")
  public ResponseEntity<?> logoutUser() {
    return ResponseEntity.ok("Logout successful");
  }

  /**
   * Authenticates a user via Google OAuth2 ID token.
   *
   * @param request the request containing the Google ID token
   * @return response entity containing authentication details
   */
  @PostMapping("/google")
  public ResponseEntity<?> googleAuth(@Valid @RequestBody GoogleAuthRequest request) {
    try {
      Map<?, ?> info =
          restTemplate.getForObject(
              "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken(),
              Map.class);
      if (info == null || info.get("email") == null) {
        return ResponseEntity.status(401).body("Invalid Google token");
      }
      String email = (String) info.get("email");
      User user = userService.findOrCreateGoogleUser(email);
      String jwt = jwtUtil.generateToken(user.getUsername());
      LoginResponse.UserDto userDto =
          new LoginResponse.UserDto(user.getUid().toString(), user.getUsername(), user.getEmail());
      return ResponseEntity.ok(new LoginResponse(jwt, 86400, userDto));
    } catch (Exception e) {
      return ResponseEntity.status(401).body("Google authentication failed");
    }
  }
}
