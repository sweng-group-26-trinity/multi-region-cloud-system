import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantsApi } from "./restaurants";
import type { Restaurant, Order } from "./types";
/**
 * Parameters for fetching restaurants via useRestaurants hook.
 */
export interface UseRestaurantsParams {
  /** Page number to fetch (default: 1) */
  page?: number;

  /** Number of items per page (default: 10) */
  pageSize?: number;

  /** Region filter (e.g., "us-east") */
  region?: string;

  /** Cuisine filter (e.g., "Italian") */
  cuisine?: string;
}

/**
 * Parameters for fetching orders via useOrders hook.
 */
export interface UseOrdersParams {
  /** Page number to fetch (default: 1) */
  page?: number;

  /** Number of items per page (default: 10) */
  pageSize?: number;

  /** Restaurant ID filter */
  restaurantId?: string;

  /** Order status filter (e.g., "pending") */
  status?: string;
}

/**
 * Fetches a paginated and filterable list of restaurants.
 * @param params - Pagination and filter options
 * @returns React Query result containing restaurants data
 */
export const useRestaurants = (params: UseRestaurantsParams = {}) => {
  return useQuery({
    queryKey: ["restaurants", params],
    queryFn: () => restaurantsApi.getAll(params),
  });
};

/**
 * Fetches a single restaurant by its ID.
 * @param id - Restaurant ID
 * @returns React Query result containing the restaurant data
 */
export const useRestaurant = (id: string) => {
  return useQuery({
    queryKey: ["restaurants", id],
    queryFn: () => restaurantsApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Creates a new restaurant.
 * @returns React Query mutation for creating a restaurant
 */
export const useCreateRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Restaurant, "id" | "createdAt" | "updatedAt">) =>
      restaurantsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
};
