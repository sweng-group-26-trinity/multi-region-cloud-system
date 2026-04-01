package com.sweng.backend.menu;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * JPA entity representing a menu item belonging to a restaurant.
 *
 * <p>Each menu item is linked to a restaurant by restaurantId and stores the information needed for
 * menu browsing and ordering.
 */
@Entity
@Table(name = "menu_items")
public class MenuItemEntity {

  /** Default constructor for JPA. */
  public MenuItemEntity() {}

  /** Unique identifier for the menu item. */
  @Id
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column(nullable = false, updatable = false)
  private UUID id;

  /** ID of the restaurant that owns this menu item. */
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column(nullable = false)
  private UUID restaurantId;

  /** Name of the menu item. */
  @Column(nullable = false, length = 100)
  private String name;

  /** Optional description of the menu item. */
  @Column(length = 500)
  private String description;

  /** Category of the menu item, such as Starter, Main, Dessert, or Drink. */
  @Column(nullable = false, length = 50)
  private String category;

  /** Price of the menu item. */
  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal price;

  /** Optional image URL for the menu item. */
  @Column(length = 255)
  private String imageUrl;

  /** Whether the menu item is currently available to order. */
  @Column(nullable = false)
  private boolean isAvailable = true;

  /** Timestamp when the menu item was created. */
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  /** Timestamp when the menu item was last updated. */
  @Column(nullable = false)
  private Instant updatedAt;

  /** Lifecycle callback triggered before first persist. Initializes ID and timestamps. */
  @PrePersist
  void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  /** Lifecycle callback triggered before update. Updates the updatedAt timestamp. */
  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  /**
   * Gets the menu item ID.
   *
   * @return the menu item UUID
   */
  public UUID getId() {
    return id;
  }

  /**
   * Sets the menu item ID.
   *
   * @param id the UUID to set
   */
  public void setId(UUID id) {
    this.id = id;
  }

  /**
   * Gets the restaurant ID.
   *
   * @return the restaurant UUID
   */
  public UUID getRestaurantId() {
    return restaurantId;
  }

  /**
   * Sets the restaurant ID.
   *
   * @param restaurantId the restaurant UUID to set
   */
  public void setRestaurantId(UUID restaurantId) {
    this.restaurantId = restaurantId;
  }

  /**
   * Gets the menu item name.
   *
   * @return the name
   */
  public String getName() {
    return name;
  }

  /**
   * Sets the menu item name.
   *
   * @param name the name to set
   */
  public void setName(String name) {
    this.name = name;
  }

  /**
   * Gets the menu item description.
   *
   * @return the description
   */
  public String getDescription() {
    return description;
  }

  /**
   * Sets the menu item description.
   *
   * @param description the description to set
   */
  public void setDescription(String description) {
    this.description = description;
  }

  /**
   * Gets the category.
   *
   * @return the category
   */
  public String getCategory() {
    return category;
  }

  /**
   * Sets the category.
   *
   * @param category the category to set
   */
  public void setCategory(String category) {
    this.category = category;
  }

  /**
   * Gets the price.
   *
   * @return the price
   */
  public BigDecimal getPrice() {
    return price;
  }

  /**
   * Sets the price.
   *
   * @param price the price to set
   */
  public void setPrice(BigDecimal price) {
    this.price = price;
  }

  /**
   * Gets the image URL.
   *
   * @return the image URL
   */
  public String getImageUrl() {
    return imageUrl;
  }

  /**
   * Sets the image URL.
   *
   * @param imageUrl the image URL to set
   */
  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  /**
   * Checks whether the menu item is available.
   *
   * @return true if available
   */
  public boolean isAvailable() {
    return isAvailable;
  }

  /**
   * Sets whether the menu item is available.
   *
   * @param available true if available
   */
  public void setAvailable(boolean available) {
    isAvailable = available;
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
