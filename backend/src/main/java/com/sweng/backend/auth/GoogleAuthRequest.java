package com.sweng.backend.auth;

import jakarta.validation.constraints.NotBlank;

/** Request body for Google OAuth2 sign-in. */
public class GoogleAuthRequest {

  @NotBlank private String idToken;

  /** Default constructor. */
  public GoogleAuthRequest() {}

  /**
   * Gets the Google ID token.
   *
   * @return the ID token
   */
  public String getIdToken() {
    return idToken;
  }

  /**
   * Sets the Google ID token.
   *
   * @param idToken the ID token
   */
  public void setIdToken(String idToken) {
    this.idToken = idToken;
  }
}
