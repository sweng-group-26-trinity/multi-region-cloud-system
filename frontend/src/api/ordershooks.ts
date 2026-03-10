import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  deleteOrder,
  getOrders,
  updateOrder,
  getOrder,
  type GetOrdersParams,
  type UpdateOrderRequest,
} from "./orders";

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
    queryFn: () => getOrders(params),
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
    mutationFn: createOrder,
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
      updateOrder(orderId, data),
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
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
/**
 * Fetches a single order by its ID.
 * @param id - Order ID
 * @returns React Query result containing the order data
 */
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
};
