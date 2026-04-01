package com.sweng.backend.menu.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** DTO representing a menu item in API responses. */
public class MenuItemDto {

  private String id;
  private String restaurantId;
  private String name;
  private String description;
  private String category;
  private BigDecimal price;
  private String imageUrl;
  private Boolean isAvailable;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;

  /** Default constructor for serialization. */
  public MenuItemDto() {}

  /** Gets the menu item ID. */
  public String getId() {
    return id;
  }

  /** Sets the menu item ID. */
  public void setId(String id) {
    this.id = id;
  }

  /** Gets the restaurant ID. */
  public String getRestaurantId() {
    return restaurantId;
  }

  /** Sets the restaurant ID. */
  public void setRestaurantId(String restaurantId) {
    this.restaurantId = restaurantId;
  }

  /** Gets the menu item name. */
  public String getName() {
    return name;
  }

  /** Sets the menu item name. */
  public void setName(String name) {
    this.name = name;
  }

  /** Gets the menu item description. */
  public String getDescription() {
    return description;
  }

  /** Sets the menu item description. */
  public void setDescription(String description) {
    this.description = description;
  }

  /** Gets the category. */
  public String getCategory() {
    return category;
  }

  /** Sets the category. */
  public void setCategory(String category) {
    this.category = category;
  }

  /** Gets the price. */
  public BigDecimal getPrice() {
    return price;
  }

  /** Sets the price. */
  public void setPrice(BigDecimal price) {
    this.price = price;
  }

  /** Gets the image URL. */
  public String getImageUrl() {
    return imageUrl;
  }

  /** Sets the image URL. */
  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  /** Gets whether the item is available. */
  public Boolean getIsAvailable() {
    return isAvailable;
  }

  /** Sets whether the item is available. */
  public void setIsAvailable(Boolean available) {
    isAvailable = available;
  }

  /** Gets the creation timestamp. */
  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  /** Sets the creation timestamp. */
  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  /** Gets the last update timestamp. */
  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  /** Sets the last update timestamp. */
  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
