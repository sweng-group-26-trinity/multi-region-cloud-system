package com.sweng.backend.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Request body for creating a new order.
 *
 * <p>Matches the OpenAPI {@code CreateOrderRequest} schema.
 */
public class CreateOrderRequest {

  /** Restaurant ID to place the order with (UUID as string). */
  @NotNull private String restaurantId;

  /** Customer name (for guest or display). */
  @NotNull
  @Size(min = 1, max = 100)
  private String customerName;

  /** Customer email. */
  @NotBlank
  @Pattern(regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
  private String customerEmail;

  /** List of items to order (must contain at least one item). */
  @NotEmpty private List<CreateOrderItemRequest> items;

  /** Optional special instructions. */
  @Size(max = 500)
  private String specialInstructions;

  /** Default constructor for deserialization. */
  public CreateOrderRequest() {}

  /**
   * Gets the restaurant ID.
   *
   * @return the restaurant ID
   */
  public String getRestaurantId() {
    return restaurantId;
  }

  /**
   * Sets the restaurant ID.
   *
   * @param restaurantId the restaurant ID to set
   */
  public void setRestaurantId(String restaurantId) {
    this.restaurantId = restaurantId;
  }

  /**
   * Gets the customer name.
   *
   * @return the customer name
   */
  public String getCustomerName() {
    return customerName;
  }

  /**
   * Sets the customer name.
   *
   * @param customerName the customer name to set
   */
  public void setCustomerName(String customerName) {
    this.customerName = customerName;
  }

  /**
   * Gets the customer email.
   *
   * @return the customer email
   */
  public String getCustomerEmail() {
    return customerEmail;
  }

  /**
   * Sets the customer email.
   *
   * @param customerEmail the customer email to set
   */
  public void setCustomerEmail(String customerEmail) {
    this.customerEmail = customerEmail;
  }

  /**
   * Gets the list of order items.
   *
   * @return the list of items
   */
  public List<CreateOrderItemRequest> getItems() {
    return items;
  }

  /**
   * Sets the list of order items.
   *
   * @param items the list of items to set
   */
  public void setItems(List<CreateOrderItemRequest> items) {
    this.items = items;
  }

  /**
   * Gets the special instructions.
   *
   * @return the special instructions
   */
  public String getSpecialInstructions() {
    return specialInstructions;
  }

  /**
   * Sets the special instructions.
   *
   * @param specialInstructions the special instructions to set
   */
  public void setSpecialInstructions(String specialInstructions) {
    this.specialInstructions = specialInstructions;
  }
}
