package com.sweng.backend.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Utility class for validation operations. */
public final class ValidationUtils {

  private ValidationUtils() {
    // Utility class, prevent instantiation
  }

  /**
   * Validates that a string does not contain null bytes (0x00), which cause PostgreSQL errors.
   *
   * @param value the string to validate
   * @param fieldName the name of the field being validated (for error messages)
   * @throws ResponseStatusException with 400 BAD_REQUEST if null byte found
   */
  public static void rejectNullBytes(String value, String fieldName) {
    if (value != null && value.indexOf('\0') >= 0) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Invalid characters in " + fieldName + ": null bytes not allowed");
    }
  }

  /**
   * Validates that all provided strings do not contain null bytes.
   *
   * @param fieldName the name of the field being validated
   * @param values the strings to validate
   * @throws ResponseStatusException with 400 BAD_REQUEST if any null byte found
   */
  public static void rejectNullBytes(String fieldName, String... values) {
    for (String value : values) {
      rejectNullBytes(value, fieldName);
    }
  }

  /**
   * Removes null bytes from a string value.
   *
   * @param value the input string
   * @return string without null bytes, or null when input is null
   */
  public static String stripNullBytes(String value) {
    if (value == null) {
      return null;
    }
    return value.replace("\0", "");
  }
}
