import { apiFetch } from "./clients";
import { Order, CreateOrderRequest, UpdateOrderRequest } from "./types";

/**
 * API client for order-related endpoints.
 */
export const ordersApi = {
  /**
   * Fetch all orders with optional filters.
   *
   * @param params optional query filters
   * @returns list of orders
   */
  getAll: (params?: {
    restaurantId?: string;
    userId?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined) as any
    ).toString();

    return apiFetch<{ data: Order[] }>(
      `/orders${query ? `?${query}` : ""}`
    );
  },

  /**
   * Fetch a single order by ID.
   *
   * @param orderId order UUID
   * @returns order details
   */
  getById: (orderId: string) =>
    apiFetch<Order>(`/orders/${orderId}`),

  /**
   * Create a new order.
   *
   * @param data order payload
   * @returns created order
   */
  create: (data: CreateOrderRequest) =>
    apiFetch<Order>(`/orders`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Update an existing order.
   *
   * @param orderId order UUID
   * @param data updated payload
   * @returns updated order
   */
  update: (orderId: string, data: UpdateOrderRequest) =>
    apiFetch<Order>(`/orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Delete an order.
   *
   * @param orderId order UUID
   */
  delete: (orderId: string) =>
    apiFetch<void>(`/orders/${orderId}`, {
      method: "DELETE",
    }),
};