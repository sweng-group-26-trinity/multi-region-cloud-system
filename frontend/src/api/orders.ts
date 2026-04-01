import { apiFetch } from "./clients";

/**
 * Represents a single line item within an order.
 */
export interface OrderItem {
  /** The unique identifier of the menu item. */
  itemId: string;

  /** Display name of the item. */
  name: string;

  /** Number of units ordered. */
  quantity: number;

  /** Price per unit in the order currency. */
  unitPrice: number;

  /** Total price for this line item (`quantity × unitPrice`). */
  subtotal: number;
}

/**
 * Represents a customer order placed at a restaurant.
 */
export interface Order {
  /** Unique identifier for the order. */
  id: string;

  /** ID of the restaurant fulfilling the order. */
  restaurantId: string;

  /** ID of the customer who placed the order. */
  customerId: string;

  /** Full name of the customer. */
  customerName: string;

  /** Email address of the customer. */
  customerEmail: string;

  /**
   * Current lifecycle status of the order.
   */
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";

  /** Total order value in the order currency. */
  totalAmount: number;

  /** Optional free-text instructions from the customer. */
  specialInstructions?: string;

  /** Ordered line items. */
  items: OrderItem[];

  /** ISO 8601 timestamp when the order was created. */
  createdAt: string;

  /** ISO 8601 timestamp when the order was last updated. */
  updatedAt: string;
}

/**
 * Item reference used when creating or updating an order.
 */
export interface OrderItemInput {
  /** ID of the menu item being ordered. */
  itemId: string;

  /** Quantity of the item requested. */
  quantity: number;
}

/**
 * Request body for creating a new order.
 */
export interface CreateOrderRequest {
  /** ID of the restaurant where the order is placed. */
  restaurantId: string;

  /** Full name of the customer placing the order. */
  customerName: string;

  /** Email address of the customer placing the order. */
  customerEmail: string;

  /** Optional special instructions for the order. */
  specialInstructions?: string;

  /** Items included in the order. */
  items: OrderItemInput[];
}

/**
 * Request body for partially updating an order.
 */
export interface UpdateOrderRequest {
  /** Updated customer name. */
  customerName?: string;

  /** Updated customer email. */
  customerEmail?: string;

  /** Updated special instructions. */
  specialInstructions?: string;

  /** Updated order status. */
  status?: string;

  /** Replacement list of order items. */
  items?: OrderItemInput[];
}

/**
 * Response returned when fetching a list of orders.
 */
export interface OrdersResponse {
  /** Array of orders matching the query filters. */
  data: Order[];
}

/**
 * Query parameters used when fetching orders.
 */
export interface GetOrdersParams {
  /** Filter orders by restaurant ID. */
  restaurantId?: string;

  /** Filter orders by user ID. */
  userId?: string;

  /** Filter orders by order status. */
  status?: string;
}

/**
 * Fetches a list of orders with optional filters.
 *
 * @param params Optional query parameters used to filter results.
 * @returns A paginated list of orders.
 */
export const getOrders = (params?: GetOrdersParams) => {
  const query = new URLSearchParams();

  if (params?.restaurantId) query.set("restaurantId", params.restaurantId);
  if (params?.userId) query.set("userId", params.userId);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();

  return apiFetch<OrdersResponse>(`/orders${qs ? `?${qs}` : ""}`);
};

/**
 * Fetches a single order by its unique identifier.
 *
 * @param orderId ID of the order to retrieve.
 * @returns The matching order.
 */
export const getOrder = (orderId: string) =>
  apiFetch<Order>(`/orders/${orderId}`);

/**
 * Creates a new order.
 *
 * @param data Order creation payload.
 * @returns The newly created order.
 */
export const createOrder = (data: CreateOrderRequest) =>
  apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });

/**
 * Updates an existing order.
 *
 * @param orderId ID of the order to update.
 * @param data Fields to update on the order.
 * @returns The updated order.
 */
export const updateOrder = (orderId: string, data: UpdateOrderRequest) =>
  apiFetch<Order>(`/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

/**
 * Deletes an order.
 *
 * @param orderId ID of the order to delete.
 */
export const deleteOrder = (orderId: string) =>
  apiFetch<void>(`/orders/${orderId}`, {
    method: "DELETE",
  });
