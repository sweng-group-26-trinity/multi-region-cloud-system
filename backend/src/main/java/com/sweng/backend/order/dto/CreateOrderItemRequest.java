package com.sweng.backend.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for an individual item within a create order request.
 *
 * <p>Matches the nested item structure in the OpenAPI {@code CreateOrderRequest} schema.
 */
public class CreateOrderItemRequest {

  /** ID of the menu item. */
  @NotBlank private String itemId;

  /** Quantity ordered (minimum 1). */
  @Min(1)
  private int quantity;

  /** Default constructor for deserialization. */
  public CreateOrderItemRequest() {}

  /**
   * Gets the item ID.
   *
   * @return the item ID
   */
  public String getItemId() {
    return itemId;
  }

  /**
   * Sets the item ID.
   *
   * @param itemId the item ID to set
   */
  public void setItemId(String itemId) {
    this.itemId = itemId;
  }

  /**
   * Gets the quantity.
   *
   * @return the quantity
   */
  public int getQuantity() {
    return quantity;
  }

  /**
   * Sets the quantity.
   *
   * @param quantity the quantity to set
   */
  public void setQuantity(int quantity) {
    this.quantity = quantity;
  }
}
