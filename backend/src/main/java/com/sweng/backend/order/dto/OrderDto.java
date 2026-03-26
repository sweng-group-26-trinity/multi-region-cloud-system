package com.sweng.backend.order.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * DTO representing an order in API responses.
 *
 * <p>Matches the OpenAPI {@code Order} schema.
 */
public class OrderDto {

  /** Unique order identifier (UUID as string). */
  private String id;

  /** Restaurant ID fulfilling the order (UUID as string). */
  private String restaurantId;

  /** Customer ID who placed the order (UUID as string, may be null). */
  private String customerId;

  /** Customer name (optional). */
  private String customerName;

  /** Customer email (optional). */
  private String customerEmail;

  /** List of items in the order. */
  private List<OrderItemDto> items;

  /** Current order status. */
  private String status;

  /** Total order amount. */
  private BigDecimal totalAmount;

  /** Special instructions (optional). */
  private String specialInstructions;

  /** Creation timestamp. */
  private OffsetDateTime createdAt;

  /** Last update timestamp. */
  private OffsetDateTime updatedAt;

  /** Default constructor for serialization. */
  public OrderDto() {}

  /**
   * Gets the order ID.
   *
   * @return the order ID
   */
  public String getId() {
    return id;
  }

  /**
   * Sets the order ID.
   *
   * @param id the order ID to set
   */
  public void setId(String id) {
    this.id = id;
  }

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
   * Gets the customer ID.
   *
   * @return the customer ID
   */
  public String getCustomerId() {
    return customerId;
  }

  /**
   * Sets the customer ID.
   *
   * @param customerId the customer ID to set
   */
  public void setCustomerId(String customerId) {
    this.customerId = customerId;
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
  public List<OrderItemDto> getItems() {
    return items;
  }

  /**
   * Sets the list of order items.
   *
   * @param items the list of items to set
   */
  public void setItems(List<OrderItemDto> items) {
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
   * Gets the total amount.
   *
   * @return the total amount
   */
  public BigDecimal getTotalAmount() {
    return totalAmount;
  }

  /**
   * Sets the total amount.
   *
   * @param totalAmount the total amount to set
   */
  public void setTotalAmount(BigDecimal totalAmount) {
    this.totalAmount = totalAmount;
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
