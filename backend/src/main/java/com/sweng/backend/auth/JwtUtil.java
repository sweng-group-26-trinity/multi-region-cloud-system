package com.sweng.backend.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Utility class for JWT token generation and validation. */
@Component
public class JwtUtil {

  /** Constructs a JwtUtil with default settings. */
  public JwtUtil() {}

  @Value("${jwt.secret}")
  private String secret;

  @Value("${jwt.expiration:86400000}")
  private Long expiration;

  private Key getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes());
  }

  /**
   * Generates a JWT token for the given username.
   *
   * @param username the username
   * @return the generated JWT token
   */
  public String generateToken(String username) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration);

    return Jwts.builder()
        .setSubject(username)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  /**
   * Extracts the username from a JWT token.
   *
   * @param token the JWT token
   * @return the username
   */
  public String getUsernameFromToken(String token) {
    Claims claims =
        Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();

    return claims.getSubject();
  }

  /**
   * Validates a JWT token.
   *
   * @param token the JWT token
   * @return true if valid, false otherwise
   */
  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }
}
