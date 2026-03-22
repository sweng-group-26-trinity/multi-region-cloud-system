import { apiFetch } from "./clients";
import type { Restaurant, RestaurantPage } from "./types";

/**
 * Parameters for fetching restaurants via restaurantsApi.getAll.
 */
export interface GetAllRestaurantsParams {
  /** Page number to fetch (0-indexed, default: 0) */
  page?: number;

  /** Number of items per page (default: 20) */
  size?: number;
}

/**
 * Request payload for creating a restaurant.
 */
export interface CreateRestaurantRequest {
  /** Restaurant business name */
  name: string;

  /** Brief description of the restaurant */
  description?: string;

  /** Physical address of the restaurant */
  address: string;

  /** Contact phone number */
  phone?: string;

  /** Contact email address */
  email?: string;

  /** URL of the restaurant's main display image */
  imageUrl?: string;

  /** URL of the restaurant's logo */
  logoUrl?: string;

  /** Type of cuisine served */
  cuisineType?: string;

  /** Business opening hours */
  openingHours?: string;
}

/**
 * Request payload for updating a restaurant.
 */
export interface UpdateRestaurantRequest {
  /** Restaurant business name */
  name?: string;

  /** Brief description of the restaurant */
  description?: string;

  /** Physical address of the restaurant */
  address?: string;

  /** Contact phone number */
  phone?: string;

  /** Contact email address */
  email?: string;

  /** URL of the restaurant's main display image */
  imageUrl?: string;

  /** URL of the restaurant's logo */
  logoUrl?: string;

  /** Type of cuisine served */
  cuisineType?: string;

  /** Business opening hours */
  openingHours?: string;

  /** Whether the restaurant is active */
  isActive?: boolean;
}

/**
 * Restaurants API client.
 *
 * Provides methods for fetching and mutating restaurant data.
 */
export const restaurantsApi = {
  /**
   * Fetches a paginated list of restaurants.
   * @param params - Pagination options
   * @returns Paginated restaurant response
   */
  getAll: async (params?: GetAllRestaurantsParams): Promise<RestaurantPage> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) {
      queryParams.append("page", params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append("size", params.size.toString());
    }

    const query = queryParams.toString();
    return apiFetch<RestaurantPage>(`/restaurants${query ? `?${query}` : ""}`);
  },

  /**
   * Fetches a single restaurant by ID.
   * @param id - Restaurant ID
   * @returns The matching restaurant
   */
  getById: async (id: string): Promise<Restaurant> => {
    return apiFetch<Restaurant>(`/restaurants/${id}`);
  },

  /**
   * Creates a new restaurant.
   * @param data - Restaurant creation payload
   * @returns The created restaurant
   */
  create: async (data: CreateRestaurantRequest): Promise<Restaurant> => {
    return apiFetch<Restaurant>("/restaurants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing restaurant.
   * @param id - Restaurant ID
   * @param data - Partial restaurant data to update
   * @returns The updated restaurant
   */
  update: async (
    id: string,
    data: UpdateRestaurantRequest,
  ): Promise<Restaurant> => {
    return apiFetch<Restaurant>(`/restaurants/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a restaurant by ID.
   * @param id - Restaurant ID
   * @returns Void on success
   */
  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/restaurants/${id}`, {
      method: "DELETE",
    });
  },
};