package com.sweng.backend.user;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/** Service for managing user-related operations. */
@Service
public class UserService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  /**
   * Constructs a UserService with required dependencies.
   *
   * @param userRepository the user repository
   * @param passwordEncoder the password encoder
   */
  public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  /**
   * Registers a new user.
   *
   * <p>If no users exist in the system, the first registered user is assigned the ADMIN role.
   * Otherwise, the user is assigned the CUSTOMER role.
   *
   * @param username the username
   * @param email the email
   * @param password the password
   * @return the registered user
   * @throws RuntimeException if username or email already exists
   */
  public User registerUser(String username, String email, String password) {
    if (userRepository.existsByUsername(username)) {
      throw new RuntimeException("Username already exists");
    }
    if (userRepository.existsByEmail(email)) {
      throw new RuntimeException("Email already exists");
    }

    String hashedPassword = passwordEncoder.encode(password);

    User user = new User(UUID.randomUUID(), username, email, hashedPassword, OffsetDateTime.now());

    boolean isFirstUser = userRepository.count() == 0;

    if (isFirstUser) {
      user.getRoles().add(Role.ADMIN);
    } else {
      user.getRoles().add(Role.CUSTOMER);
    }

    return userRepository.save(user);
  }

  /**
   * Finds a user by username.
   *
   * @param username the username
   * @return the user
   * @throws RuntimeException if user not found
   */
  public User findByUsername(String username) {
    return userRepository
        .findByUsername(username)
        .orElseThrow(() -> new RuntimeException("User not found"));
  }

  /**
   * Finds a user by email.
   *
   * @param email the email
   * @return the user
   * @throws RuntimeException if user not found
   */
  public User findByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));
  }

  /**
   * Finds a user by email, or creates a new one if they don't exist. Used for Google OAuth2
   * sign-in.
   *
   * @param email the Google account email
   * @return the existing or newly created user
   */
  public User findOrCreateGoogleUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseGet(
            () -> {
              String base = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "");
              String username = base;
              int i = 1;
              while (userRepository.existsByUsername(username)) {
                username = base + i++;
              }
              User user =
                  new User(
                      java.util.UUID.randomUUID(),
                      username,
                      email,
                      passwordEncoder.encode(java.util.UUID.randomUUID().toString()),
                      java.time.OffsetDateTime.now());
              user.getRoles().add(Role.CUSTOMER);
              return userRepository.save(user);
            });
  }
}
