package com.sweng.backend.order.dto;

import java.math.BigDecimal;

/**
 * DTO representing an individual item in an order.
 *
 * <p>Matches the OpenAPI {@code OrderItem} schema.
 */
public class OrderItemDto {

  /** Menu item identifier. */
  private String itemId;

  /** Menu item name. */
  private String name;

  /** Quantity ordered (minimum 1). */
  private int quantity;

  /** Unit price in dollars. */
  private BigDecimal unitPrice;

  /** Subtotal for this item (quantity × unitPrice). */
  private BigDecimal subtotal;

  /** Default constructor for serialization. */
  public OrderItemDto() {}

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
   * Gets the item name.
   *
   * @return the item name
   */
  public String getName() {
    return name;
  }

  /**
   * Sets the item name.
   *
   * @param name the item name to set
   */
  public void setName(String name) {
    this.name = name;
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

  /**
   * Gets the unit price.
   *
   * @return the unit price
   */
  public BigDecimal getUnitPrice() {
    return unitPrice;
  }

  /**
   * Sets the unit price.
   *
   * @param unitPrice the unit price to set
   */
  public void setUnitPrice(BigDecimal unitPrice) {
    this.unitPrice = unitPrice;
  }

  /**
   * Gets the subtotal.
   *
   * @return the subtotal
   */
  public BigDecimal getSubtotal() {
    return subtotal;
  }

  /**
   * Sets the subtotal.
   *
   * @param subtotal the subtotal to set
   */
  public void setSubtotal(BigDecimal subtotal) {
    this.subtotal = subtotal;
  }
}
