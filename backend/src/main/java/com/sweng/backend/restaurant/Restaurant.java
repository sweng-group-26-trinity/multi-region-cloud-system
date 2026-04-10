package com.sweng.backend.restaurant;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/** JPA entity representing a restaurant (legacy model). */
@Entity
@Table(name = "restaurants")
public class Restaurant {

  @Id private String id;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 200)
  private String address;

  @Column(length = 500)
  private String description;

  private String phone;
  private String email;
  private String cuisineType;
  private String openingHours;

  private String ownerId;

  private Boolean isActive;

  /** URL of the restaurant's main display image. */
  @Column private String imageUrl;

  /** URL of the restaurant's logo image. */
  @Column private String logoUrl;

  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;

  /** Default constructor for JPA. */
  public Restaurant() {}

  /** Lifecycle callback triggered before first persist. Initializes ID and timestamps. */
  @PrePersist
  public void prePersist() {
    if (id == null) id = UUID.randomUUID().toString();
    OffsetDateTime now = OffsetDateTime.now();
    createdAt = now;
    updatedAt = now;
    if (isActive == null) isActive = true;
  }

  /** Lifecycle callback triggered before update. Updates the updatedAt timestamp. */
  @PreUpdate
  public void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }

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
   * @param id the restaurant ID
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
   * @param name the restaurant name
   */
  public void setName(String name) {
    this.name = name;
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
   * @param address the restaurant address
   */
  public void setAddress(String address) {
    this.address = address;
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
   * @param description the restaurant description
   */
  public void setDescription(String description) {
    this.description = description;
  }

  /**
   * Gets the restaurant phone number.
   *
   * @return the restaurant phone number
   */
  public String getPhone() {
    return phone;
  }

  /**
   * Sets the restaurant phone number.
   *
   * @param phone the restaurant phone number
   */
  public void setPhone(String phone) {
    this.phone = phone;
  }

  /**
   * Gets the restaurant email.
   *
   * @return the restaurant email
   */
  public String getEmail() {
    return email;
  }

  /**
   * Sets the restaurant email.
   *
   * @param email the restaurant email
   */
  public void setEmail(String email) {
    this.email = email;
  }

  /**
   * Gets the restaurant image URL.
   *
   * @return the restaurant image URL
   */
  public String getImageUrl() {
    return imageUrl;
  }

  /**
   * Sets the restaurant image URL.
   *
   * @param imageUrl the restaurant image URL
   */
  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  /**
   * Gets the restaurant logo URL.
   *
   * @return the restaurant logo URL
   */
  public String getLogoUrl() {
    return logoUrl;
  }

  /**
   * Sets the restaurant logo URL.
   *
   * @param logoUrl the restaurant logo URL
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
   * @param cuisineType the cuisine type
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
   * @param openingHours the opening hours
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
   * @param ownerId the owner ID
   */
  public void setOwnerId(String ownerId) {
    this.ownerId = ownerId;
  }

  /**
   * Gets whether the restaurant is active.
   *
   * @return whether the restaurant is active
   */
  public Boolean getIsActive() {
    return isActive;
  }

  /**
   * Sets whether the restaurant is active.
   *
   * @param active whether the restaurant is active
   */
  public void setIsActive(Boolean active) {
    isActive = active;
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
   * @param createdAt the creation timestamp
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
   * @param updatedAt the last update timestamp
   */
  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
