package com.sweng.backend.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;

/**
 * Embeddable representation of a single item within an order.
 *
 * <p>Stored in the {@code order_items} collection table.
 */
@Embeddable
public class OrderItemEmbeddable {

  /** Default constructor for JPA. */
  public OrderItemEmbeddable() {}

  /** Identifier of the menu item. */
  @Column(nullable = false)
  private String itemId;

  /** Display name of the item. */
  @Column(nullable = false, length = 200)
  private String name;

  /** Quantity ordered (minimum 1). */
  @Column(nullable = false)
  private int quantity;

  /** Price per unit. */
  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal unitPrice;

  /** Subtotal for this item (quantity × unitPrice). */
  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal subtotal;

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
