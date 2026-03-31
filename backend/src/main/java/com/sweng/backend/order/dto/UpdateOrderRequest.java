package com.sweng.backend.order.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Request body for updating an existing order.
 *
 * <p>Matches the OpenAPI {@code UpdateOrderRequest} schema.
 */
@JsonIgnoreProperties(ignoreUnknown = false)
public class UpdateOrderRequest {

  /** Optional updated customer name. */
  @Size(min = 1, max = 100)
  private String customerName;

  /** Optional updated customer email. */
  @Size(max = 255)
  @Pattern(
      regexp =
          "^[a-zA-Z0-9_%+-]+(?:\\.[a-zA-Z0-9_%+-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\\.[a-zA-Z]{2,63}$")
  private String customerEmail;

  /**
   * Optional updated list of items.
   *
   * <p>If provided, must contain at least one item.
   */
  @Valid private List<CreateOrderItemRequest> items;

  /**
   * Optional new order status.
   *
   * <p>Allowed values: pending, preparing, ready, completed, cancelled.
   */
  private String status;

  /** Optional updated special instructions. */
  @Size(max = 500)
  private String specialInstructions;

  /** Default constructor for deserialization. */
  public UpdateOrderRequest() {}

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
   * Gets the order status.
   *
   * @return the order status
   */
  public String getStatus() {
    return status;
  }

  /**
   * Sets the order status.
   *
   * @param status the order status to set
   */
  public void setStatus(String status) {
    this.status = status;
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
