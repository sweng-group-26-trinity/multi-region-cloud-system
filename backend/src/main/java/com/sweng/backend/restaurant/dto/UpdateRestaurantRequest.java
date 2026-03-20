package com.sweng.backend.restaurant.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request body for updating an existing restaurant. */
public class UpdateRestaurantRequest {

  @Size(min = 1, max = 100)
  private String name;

  @Size(max = 500)
  private String description;

  @Size(min = 1, max = 200)
  private String address;

  @Size(max = 20)
  private String phone;

  @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
  private String email;

  /** Optional URL for the restaurant's main image. */
  @Size(max = 255)
  private String imageUrl;

  /** Optional URL for the restaurant's logo. */
  @Size(max = 255)
  private String logoUrl;

  @Size(max = 50)
  private String cuisineType;

  @Size(max = 100)
  private String openingHours;

  private Boolean isActive;

  /** Default constructor for deserialization. */
  public UpdateRestaurantRequest() {}

  /**
   * Gets the restaurant name.
   *
   * @return the restaurant name
   */
  public String getName() {
    return name;
  }

  /**
   * Sets the restaurant name.
   *
   * @param name the restaurant name to set
   */
  public void setName(String name) {
    this.name = name;
  }

  /**
   * Gets the restaurant description.
   *
   * @return the restaurant description
   */
  public String getDescription() {
    return description;
  }

  /**
   * Sets the restaurant description.
   *
   * @param description the restaurant description to set
   */
  public void setDescription(String description) {
    this.description = description;
  }

  /**
   * Gets the restaurant address.
   *
   * @return the restaurant address
   */
  public String getAddress() {
    return address;
  }

  /**
   * Sets the restaurant address.
   *
   * @param address the restaurant address to set
   */
  public void setAddress(String address) {
    this.address = address;
  }

  /**
   * Gets the phone number.
   *
   * @return the phone number
   */
  public String getPhone() {
    return phone;
  }

  /**
   * Sets the phone number.
   *
   * @param phone the phone number to set
   */
  public void setPhone(String phone) {
    this.phone = phone;
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
   * @param email the email address to set
   */
  public void setEmail(String email) {
    this.email = email;
  }

  /**
   * Gets the restaurant image URL.
   *
   * @return the image URL
   */
  public String getImageUrl() {
    return imageUrl;
  }

  /**
   * Sets the restaurant image URL.
   *
   * @param imageUrl the image URL to set
   */
  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  /**
   * Gets the restaurant logo URL.
   *
   * @return the logo URL
   */
  public String getLogoUrl() {
    return logoUrl;
  }

  /**
   * Sets the restaurant logo URL.
   *
   * @param logoUrl the logo URL to set
   */
  public void setLogoUrl(String logoUrl) {
    this.logoUrl = logoUrl;
  }

  /**
   * Gets the cuisine type.
   *
   * @return the cuisine type
   */
  public String getCuisineType() {
    return cuisineType;
  }

  /**
   * Sets the cuisine type.
   *
   * @param cuisineType the cuisine type to set
   */
  public void setCuisineType(String cuisineType) {
    this.cuisineType = cuisineType;
  }

  /**
   * Gets the opening hours.
   *
   * @return the opening hours
   */
  public String getOpeningHours() {
    return openingHours;
  }

  /**
   * Sets the opening hours.
   *
   * @param openingHours the opening hours to set
   */
  public void setOpeningHours(String openingHours) {
    this.openingHours = openingHours;
  }

  /**
   * Gets the active status.
   *
   * @return true if restaurant is active
   */
  public Boolean getIsActive() {
    return isActive;
  }

  /**
   * Sets the active status.
   *
   * @param active the active status to set
   */
  public void setIsActive(Boolean active) {
    isActive = active;
  }
}