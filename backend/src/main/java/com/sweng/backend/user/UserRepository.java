package com.sweng.backend.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Repository for managing User entities. */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
  /**
   * Finds a user by username.
   *
   * @param username the username
   * @return optional containing the user if found
   */
  Optional<User> findByUsername(String username);

  /**
   * Finds a user by email.
   *
   * @param email the email
   * @return optional containing the user if found
   */
  Optional<User> findByEmail(String email);

  /**
   * Checks if a username exists.
   *
   * @param username the username
   * @return true if exists
   */
  boolean existsByUsername(String username);

  /**
   * Checks if an email exists.
   *
   * @param email the email
   * @return true if exists
   */
  boolean existsByEmail(String email);
}
