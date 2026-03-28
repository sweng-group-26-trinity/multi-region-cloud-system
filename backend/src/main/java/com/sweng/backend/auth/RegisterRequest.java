package com.sweng.backend.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request object for user registration. */
public class RegisterRequest {

  @NotBlank
  @Size(min = 3, max = 50)
  @Pattern(
      regexp = "^[a-zA-Z0-9_-]+$",
      message = "Username must contain only letters, numbers, underscores, or hyphens")
  private String username;

  @NotBlank
  @Pattern(
      regexp =
          "^[a-zA-Z0-9_%+-]+(?:\\.[a-zA-Z0-9_%+-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\\.[a-zA-Z]{2,63}$",
      message = "Invalid email format")
  @Size(max = 120)
  private String email;

  @NotBlank
  @Size(min = 8, max = 72)
  @Pattern(
      regexp = "^[\\x20-\\x7E]+$",
      message = "Password must contain only ASCII printable characters")
  private String password;

  @Size(max = 50)
  @Pattern(
      regexp = "^[\\x20-\\x7E]*$",
      message = "First name must contain only ASCII printable characters")
  private String firstName;

  @Size(max = 50)
  @Pattern(
      regexp = "^[\\x20-\\x7E]*$",
      message = "Last name must contain only ASCII printable characters")
  private String lastName;

  /** Constructs a RegisterRequest with default values. */
  public RegisterRequest() {}

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
   * Gets the password.
   *
   * @return the password
   */
  public String getPassword() {
    return password;
  }

  /**
   * Sets the password.
   *
   * @param password the password to set
   */
  public void setPassword(String password) {
    this.password = password;
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
}
