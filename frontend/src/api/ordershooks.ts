import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "./orders";
import type { UpdateOrderRequest, CreateOrderRequest } from "./types";

/**
 * Parameters required to fetch orders.
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
 * Parameters required to update an order.
 */
export interface UpdateOrderParams {
  /** ID of the order being updated. */
  orderId: string;

  /** Fields to update on the order. */
  data: UpdateOrderRequest;
}

/**
 * Fetches a list of orders using React Query.
 *
 * @param params Optional query filters.
 * @returns A React Query result containing the list of orders.
 */
export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.getAll(params),
  });
}

/**
 * Mutation hook for creating a new order.
 *
 * Automatically invalidates the orders cache after success.
 *
 * @returns React Query mutation for order creation.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/**
 * Mutation hook for updating an existing order.
 *
 * Automatically invalidates cached orders after success.
 *
 * @returns React Query mutation for updating orders.
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: UpdateOrderParams) =>
      ordersApi.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/**
 * Mutation hook for deleting an order.
 *
 * Automatically invalidates cached orders after success.
 *
 * @returns React Query mutation for deleting orders.
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.delete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/**
 * Fetches a single order by its ID.
 *
 * @param id - Order ID
 * @returns React Query result containing the order data
 */
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });
};