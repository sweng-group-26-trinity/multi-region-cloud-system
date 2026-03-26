package com.sweng.backend.order;

/**
 * Status values for an order.
 *
 * <p>Matches the OpenAPI enum for order status: pending, preparing, ready, completed, cancelled.
 */
public enum OrderStatus {
  /** Order has been created but not yet started. */
  pending,

  /** Restaurant is preparing the order. */
  preparing,

  /** Order is ready for pickup/delivery. */
  ready,

  /** Order has been completed. */
  completed,

  /** Order has been cancelled. */
  cancelled
}
