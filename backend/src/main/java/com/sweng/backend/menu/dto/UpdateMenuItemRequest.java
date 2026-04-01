package com.sweng.backend.menu.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** Request body for updating an existing menu item. */
public class UpdateMenuItemRequest {

  @Size(min = 1, max = 100)
  private String name;

  @Size(max = 500)
  private String description;

  @Size(min = 1, max = 50)
  private String category;

  @DecimalMin(value = "0.0", inclusive = true)
  private BigDecimal price;

  @Size(max = 255)
  private String imageUrl;

  private Boolean isAvailable;

  /** Default constructor for deserialization. */
  public UpdateMenuItemRequest() {}

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
   * Gets whether the item is available.
   *
   * @return true if available
   */
  public Boolean getIsAvailable() {
    return isAvailable;
  }

  /**
   * Sets whether the item is available.
   *
   * @param available the availability flag to set
   */
  public void setIsAvailable(Boolean available) {
    isAvailable = available;
  }
}