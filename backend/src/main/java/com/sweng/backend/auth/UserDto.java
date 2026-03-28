package com.sweng.backend.auth;

import java.time.OffsetDateTime;
import java.util.List;

/** DTO representing user account information. */
public class UserDto {

  private String id;
  private String username;
  private String email;
  private String firstName;
  private String lastName;
  private List<String> roles;
  private OffsetDateTime createdAt;

  /** Constructs a UserDto with default values. */
  public UserDto() {}

  /**
   * Gets the user identifier.
   *
   * @return the user identifier
   */
  public String getId() {
    return id;
  }

  /**
   * Sets the user identifier.
   *
   * @param id the id to set
   */
  public void setId(String id) {
    this.id = id;
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
   * Sets the username.
   *
   * @param username the username to set
   */
  public void setUsername(String username) {
    this.username = username;
  }

  /**
   * Gets the email address.
   *
   * @return the email address
   */
  public String getEmail() {
    return email;
  }

  /**
   * Sets the email address.
   *
   * @param email the email to set
   */
  public void setEmail(String email) {
    this.email = email;
  }

  /**
   * Gets the first name.
   *
   * @return the first name
   */
  public String getFirstName() {
    return firstName;
  }

  /**
   * Sets the first name.
   *
   * @param firstName the first name to set
   */
  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }

  /**
   * Gets the last name.
   *
   * @return the last name
   */
  public String getLastName() {
    return lastName;
  }

  /**
   * Sets the last name.
   *
   * @param lastName the last name to set
   */
  public void setLastName(String lastName) {
    this.lastName = lastName;
  }

  /**
   * Gets the roles.
   *
   * @return the roles
   */
  public List<String> getRoles() {
    return roles;
  }

  /**
   * Sets the roles.
   *
   * @param roles the roles to set
   */
  public void setRoles(List<String> roles) {
    this.roles = roles;
  }

  /**
   * Gets the created timestamp.
   *
   * @return the created timestamp
   */
  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  /**
   * Sets the created timestamp.
   *
   * @param createdAt the created timestamp to set
   */
  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
