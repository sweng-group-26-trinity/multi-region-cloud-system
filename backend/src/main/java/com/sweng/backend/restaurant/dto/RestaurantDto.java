package com.sweng.backend.restaurant.dto;

import java.time.OffsetDateTime;

/** DTO representing a restaurant in API responses. */
public class RestaurantDto {
  private String id;
  private String name;
  private String description;
  private String address;
  private String phone;
  private String email;
  private String cuisineType;
  private String openingHours;
  private String ownerId;
  private Boolean isActive;
  private String imageUrl;
  private String logoUrl;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;

  /** Default constructor for serialization. */
  public RestaurantDto() {}

  /**
   * Gets the restaurant ID.
   *
   * @return the restaurant ID
   */
  public String getId() {
    return id;
  }

  /**
   * Sets the restaurant ID.
   *
   * @param id the restaurant ID to set
   */
  public void setId(String id) {
    this.id = id;
  }

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
   * Gets the owner ID.
   *
   * @return the owner ID
   */
  public String getOwnerId() {
    return ownerId;
  }

  /**
   * Sets the owner ID.
   *
   * @param ownerId the owner ID to set
   */
  public void setOwnerId(String ownerId) {
    this.ownerId = ownerId;
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

  /**
   * Gets the restaurant's main image URL.
   *
   * @return the main image URL
   */
  public String getImageUrl() {
    return imageUrl;
  }

  /**
   * Sets the restaurant's main image URL.
   *
   * @param imageUrl the main image URL to set
   */
  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  /**
   * Gets the restaurant's logo URL.
   *
   * @return the logo URL
   */
  public String getLogoUrl() {
    return logoUrl;
  }

  /**
   * Sets the restaurant's logo URL.
   *
   * @param logoUrl the logo URL to set
   */
  public void setLogoUrl(String logoUrl) {
    this.logoUrl = logoUrl;
  }

  /**
   * Gets the creation timestamp.
   *
   * @return the creation timestamp
   */
  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  /**
   * Sets the creation timestamp.
   *
   * @param createdAt the creation timestamp to set
   */
  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  /**
   * Gets the last update timestamp.
   *
   * @return the last update timestamp
   */
  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  /**
   * Sets the last update timestamp.
   *
   * @param updatedAt the last update timestamp to set
   */
  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
