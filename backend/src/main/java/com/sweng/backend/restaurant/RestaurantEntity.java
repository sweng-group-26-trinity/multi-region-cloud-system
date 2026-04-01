package com.sweng.backend.restaurant;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * JPA entity representing a restaurant in the system.
 *
 * <p>This entity maps to the {@code restaurants} table and stores business information such as
 * name, address, contact details, ownership, and lifecycle timestamps.
 */
@Entity
@Table(name = "restaurants")
public class RestaurantEntity {

  /** Default constructor for JPA. */
  public RestaurantEntity() {}

  /** Unique identifier for the restaurant (UUID primary key). */
  @Id
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column(nullable = false, updatable = false)
  private UUID id;

  /** Business name of the restaurant. */
  @Column(nullable = false, length = 100)
  private String name;

  /** Optional description of the restaurant. */
  @Column(length = 500)
  private String description;

  /** Physical address of the restaurant. */
  @Column(nullable = false, length = 200)
  private String address;

  /** Contact phone number. */
  @NotNull
  @Column(nullable = false, length = 20)
  private String phone;

  /** Optional contact email address. */
  @Column(length = 255)
  private String email;

  /** Optional URL of the restaurant's main display image. */
  @Column(length = 255)
  private String imageUrl;

  /** Optional URL of the restaurant's logo image. */
  @Column(length = 255)
  private String logoUrl;

  /** Type of cuisine served by the restaurant. */
  @NotNull
  @Column(nullable = false, length = 50)
  private String cuisineType;

  /** Opening hours of the restaurant. */
  @NotNull
  @Column(nullable = false, length = 100)
  private String openingHours;

  /** UUID of the user who owns the restaurant. */
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column(nullable = false)
  private UUID ownerId;

  /** Indicates whether the restaurant is active and accepting orders. */
  @Column(nullable = false)
  private boolean isActive = true;

  /** Timestamp when the restaurant was created. */
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  /** Timestamp when the restaurant was last updated. */
  @Column(nullable = false)
  private Instant updatedAt;

  /**
   * Lifecycle callback triggered before the entity is first persisted. Initializes ID and
   * timestamps.
   */
  @PrePersist
  void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  /**
   * Lifecycle callback triggered before the entity is updated. Updates the {@code updatedAt}
   * timestamp.
   */
  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  /**
   * Gets the restaurant ID.
   *
   * @return the restaurant UUID
   */
  public UUID getId() {
    return id;
  }

  /**
   * Sets the restaurant ID.
   *
   * @param id the UUID to set
   */
  public void setId(UUID id) {
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
   * @return the description
   */
  public String getDescription() {
    return description;
  }

  /**
   * Sets the restaurant description.
   *
   * @param description the description to set
   */
  public void setDescription(String description) {
    this.description = description;
  }

  /**
   * Gets the restaurant address.
   *
   * @return the address
   */
  public String getAddress() {
    return address;
  }

  /**
   * Sets the restaurant address.
   *
   * @param address the physical address to set
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
   * @param phone the contact phone to set
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
   * @param email the contact email to set
   */
  public void setEmail(String email) {
    this.email = email;
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
   * @param openingHours the opening hours string to set
   */
  public void setOpeningHours(String openingHours) {
    this.openingHours = openingHours;
  }

  /**
   * Gets the owner ID.
   *
   * @return the owner UUID
   */
  public UUID getOwnerId() {
    return ownerId;
  }

  /**
   * Sets the owner ID.
   *
   * @param ownerId the owner UUID to set
   */
  public void setOwnerId(UUID ownerId) {
    this.ownerId = ownerId;
  }

  /**
   * Checks if the restaurant is active.
   *
   * @return true if the restaurant is active
   */
  public boolean isActive() {
    return isActive;
  }

  /**
   * Sets the active status.
   *
   * @param active true to mark as active
   */
  public void setActive(boolean active) {
    isActive = active;
  }

  /**
   * Gets the creation timestamp.
   *
   * @return the creation timestamp
   */
  public Instant getCreatedAt() {
    return createdAt;
  }

  /**
   * Sets the creation timestamp.
   *
   * @param createdAt the creation timestamp to set
   */
  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  /**
   * Gets the last update timestamp.
   *
   * @return the last update timestamp
   */
  public Instant getUpdatedAt() {
    return updatedAt;
  }

  /**
   * Sets the last update timestamp.
   *
   * @param updatedAt the last update timestamp to set
   */
  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
