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

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public String getLogoUrl() {
    return logoUrl;
  }

  public void setLogoUrl(String logoUrl) {
    this.logoUrl = logoUrl;
  }

  public String getCuisineType() {
    return cuisineType;
  }

  public void setCuisineType(String cuisineType) {
    this.cuisineType = cuisineType;
  }

  public String getOpeningHours() {
    return openingHours;
  }

  public void setOpeningHours(String openingHours) {
    this.openingHours = openingHours;
  }

  public String getOwnerId() {
    return ownerId;
  }

  public void setOwnerId(String ownerId) {
    this.ownerId = ownerId;
  }

  public Boolean getIsActive() {
    return isActive;
  }

  public void setIsActive(Boolean active) {
    isActive = active;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
