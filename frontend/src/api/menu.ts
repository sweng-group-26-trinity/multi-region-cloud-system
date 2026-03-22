import { apiFetch } from "./clients";
import type { MenuItem, MenuItemListResponse } from "./types";

/**
 * Query parameters for fetching a restaurant menu.
 */
export interface GetRestaurantMenuParams {
  /** Optional category filter */
  category?: string;

  /** Whether to fetch only available items */
  availableOnly?: boolean;
}

/**
 * Request payload for creating a menu item.
 */
export interface CreateMenuItemRequest {
  /** Menu item name */
  name: string;

  /** Optional menu item description */
  description?: string;

  /** Menu item category */
  category: string;

  /** Menu item price */
  price: number;

  /** Optional image URL */
  imageUrl?: string;

  /** Whether the item is available */
  isAvailable?: boolean;
}

/**
 * Request payload for updating a menu item.
 */
export interface UpdateMenuItemRequest {
  /** Menu item name */
  name?: string;

  /** Optional menu item description */
  description?: string;

  /** Menu item category */
  category?: string;

  /** Menu item price */
  price?: number;

  /** Optional image URL */
  imageUrl?: string;

  /** Whether the item is available */
  isAvailable?: boolean;
}

/**
 * Menu API client.
 */
export const menuApi = {
  /**
   * Fetches all menu items for a restaurant.
   *
   * @param restaurantId - Restaurant ID
   * @param params - Optional query parameters
   * @returns Menu item list response
   */
  getAll: async (
    restaurantId: string,
    params?: GetRestaurantMenuParams,
  ): Promise<MenuItemListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.category) {
      queryParams.append("category", params.category);
    }

    if (params?.availableOnly !== undefined) {
      queryParams.append("availableOnly", String(params.availableOnly));
    }

    const query = queryParams.toString();

    return apiFetch<MenuItemListResponse>(
      `/restaurants/${restaurantId}/menu${query ? `?${query}` : ""}`,
    );
  },

  /**
   * Fetches a single menu item by ID.
   *
   * @param restaurantId - Restaurant ID
   * @param menuItemId - Menu item ID
   * @returns Menu item
   */
  getById: async (
    restaurantId: string,
    menuItemId: string,
  ): Promise<MenuItem> => {
    return apiFetch<MenuItem>(
      `/restaurants/${restaurantId}/menu/${menuItemId}`,
    );
  },

  /**
   * Creates a menu item for a restaurant.
   *
   * @param restaurantId - Restaurant ID
   * @param data - Menu item payload
   * @returns Created menu item
   */
  create: async (
    restaurantId: string,
    data: CreateMenuItemRequest,
  ): Promise<MenuItem> => {
    return apiFetch<MenuItem>(`/restaurants/${restaurantId}/menu`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates a menu item.
   *
   * @param restaurantId - Restaurant ID
   * @param menuItemId - Menu item ID
   * @param data - Updated menu item payload
   * @returns Updated menu item
   */
  update: async (
    restaurantId: string,
    menuItemId: string,
    data: UpdateMenuItemRequest,
  ): Promise<MenuItem> => {
    return apiFetch<MenuItem>(
      `/restaurants/${restaurantId}/menu/${menuItemId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * Deletes a menu item.
   *
   * @param restaurantId - Restaurant ID
   * @param menuItemId - Menu item ID
   */
  delete: async (restaurantId: string, menuItemId: string): Promise<void> => {
    return apiFetch<void>(`/restaurants/${restaurantId}/menu/${menuItemId}`, {
      method: "DELETE",
    });
  },
};