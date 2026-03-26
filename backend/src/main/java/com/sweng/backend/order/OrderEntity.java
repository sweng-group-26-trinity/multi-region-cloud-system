package com.sweng.backend.order;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * JPA entity representing a customer order.
 *
 * <p>Stores order header fields and embeds the list of ordered items via {@link
 * OrderItemEmbeddable}.
 */
@Entity
@Table(name = "orders")
public class OrderEntity {

  /** Default constructor for JPA. */
  public OrderEntity() {}

  /** Primary key for the order. */
  @Id
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column(nullable = false, updatable = false)
  private UUID id;

  /** Restaurant fulfilling this order. */
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column(nullable = false)
  private UUID restaurantId;

  /**
   * Authenticated customer who placed the order.
   *
   * <p>May be null for guest orders, per spec.
   */
  @JdbcTypeCode(SqlTypes.VARCHAR)
  @Column
  private UUID customerId;

  /** Customer display name. */
  @NotNull
  @Column(nullable = false, length = 100)
  private String customerName;

  /** Customer email for notifications. */
  @NotNull
  @Column(nullable = false, length = 255)
  private String customerEmail;

  /** Order status. */
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OrderStatus status = OrderStatus.pending;

  /** Total order amount. */
  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  /** Special instructions (optional). */
  @Column(length = 500)
  private String specialInstructions;

  /** Creation timestamp. */
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  /** Last update timestamp. */
  @Column(nullable = false)
  private Instant updatedAt;

  /** Items in this order. */
  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
  private List<OrderItemEmbeddable> items = new ArrayList<>();

  /** Lifecycle callback triggered before first persist. Initializes ID and timestamps. */
  @PrePersist
  void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
    if (status == null) {
      status = OrderStatus.pending;
    }
    if (totalAmount == null) {
      totalAmount = BigDecimal.ZERO;
    }
    if (items == null) {
      items = new ArrayList<>();
    }
  }

  /** Lifecycle callback triggered before update. Updates {@code updatedAt}. */
  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  /**
   * Gets the order ID.
   *
   * @return the order ID
   */
  public UUID getId() {
    return id;
  }

  /**
   * Sets the order ID.
   *
   * @param id the order ID to set
   */
  public void setId(UUID id) {
    this.id = id;
  }

  /**
   * Gets the restaurant ID.
   *
   * @return the restaurant ID
   */
  public UUID getRestaurantId() {
    return restaurantId;
  }

  /**
   * Sets the restaurant ID.
   *
   * @param restaurantId the restaurant ID to set
   */
  public void setRestaurantId(UUID restaurantId) {
    this.restaurantId = restaurantId;
  }

  /**
   * Gets the customer ID.
   *
   * @return the customer ID (may be null)
   */
  public UUID getCustomerId() {
    return customerId;
  }

  /**
   * Sets the customer ID.
   *
   * @param customerId the customer ID to set (may be null)
   */
  public void setCustomerId(UUID customerId) {
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
   * Gets the order status.
   *
   * @return the order status
   */
  public OrderStatus getStatus() {
    return status;
  }

  /**
   * Sets the order status.
   *
   * @param status the order status to set
   */
  public void setStatus(OrderStatus status) {
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

  /**
   * Gets the list of order items.
   *
   * @return the list of items
   */
  public List<OrderItemEmbeddable> getItems() {
    return items;
  }

  /**
   * Sets the list of order items.
   *
   * @param items the list of items to set
   */
  public void setItems(List<OrderItemEmbeddable> items) {
    this.items = items;
  }
}
