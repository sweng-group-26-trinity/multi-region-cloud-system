package com.sweng.backend.user;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Entity representing a user in the system. */
@Entity
@Table(name = "users")
public class User {

  @Id
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column(nullable = false, updatable = false)
  private UUID uid;

  @Column(nullable = false, unique = true, length = 50)
  private String username;

  @Column(nullable = false, unique = true, length = 120)
  private String email;

  // store BCrypt hash
  @Column(nullable = false)
  private String passwordHash;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
  @Enumerated(EnumType.STRING)
  @Column(name = "role")
  private java.util.Set<Role> roles = new java.util.HashSet<>();

  /** Protected constructor for JPA. */
  protected User() {}

  /**
   * Constructs a User with the specified details.
   *
   * @param uid the unique identifier
   * @param username the username
   * @param email the email address
   * @param passwordHash the password hash
   * @param createdAt the account creation timestamp
   */
  public User(
      UUID uid, String username, String email, String passwordHash, OffsetDateTime createdAt) {
    this.uid = uid;
    this.username = username;
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
  }

  /**
   * Gets the unique identifier.
   *
   * @return the uid
   */
  public UUID getUid() {
    return uid;
  }

  /**
   * Gets the roles.
   *
   * @return the roles
   */
  public java.util.Set<Role> getRoles() {
    return roles;
  }

  /**
   * Gets the username.
   *
   * @return the username
   */
  public String getUsername() {
    return username;
  }

  /**
   * Gets the email.
   *
   * @return the email
   */
  public String getEmail() {
    return email;
  }

  /**
   * Gets the password hash.
   *
   * @return the password hash
   */
  public String getPasswordHash() {
    return passwordHash;
  }

  /**
   * Gets the account creation timestamp.
   *
   * @return the account creation timestamp
   */
  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  /**
   * Sets the username.
   *
   * @param username the username to set
   */
  public void setUsername(String username) {
    this.username = username;
  }

  /**
   * Sets the email.
   *
   * @param email the email to set
   */
  public void setEmail(String email) {
    this.email = email;
  }

  /**
   * Sets the password hash.
   *
   * @param passwordHash the password hash to set
   */
  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  /**
   * Sets the account creation timestamp.
   *
   * @param createdAt the account creation timestamp to set
   */
  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
