import { apiFetch } from "./clients";

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  totalAmount: number;
  specialInstructions?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  restaurantId: string;
  customerName: string;
  customerEmail: string;
  specialInstructions?: string;
  items: { itemId: string; quantity: number }[];
}

export interface UpdateOrderRequest {
  customerName?: string;
  customerEmail?: string;
  specialInstructions?: string;
  status?: string;
  items?: { itemId: string; quantity: number }[];
}

export const getOrders = (params?: { restaurantId?: string; userId?: string; status?: string }) => {
  const query = new URLSearchParams();
  if (params?.restaurantId) query.set("restaurantId", params.restaurantId);
  if (params?.userId) query.set("userId", params.userId);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return apiFetch<{ data: Order[] }>(`/api/orders${qs ? `?${qs}` : ""}`);
};

export const getOrder = (orderId: string) =>
  apiFetch<Order>(`/api/orders/${orderId}`);

export const createOrder = (data: CreateOrderRequest) =>
  apiFetch<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateOrder = (orderId: string, data: UpdateOrderRequest) =>
  apiFetch<Order>(`/api/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteOrder = (orderId: string) =>
  apiFetch<void>(`/api/orders/${orderId}`, { method: "DELETE" });
