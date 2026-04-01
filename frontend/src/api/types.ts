export interface Restaurant {
  id: string;
  name: string;
  cuisineType: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  isActive: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
/**
 * Represents a menu item.
 */
export interface MenuItem {
  /** Unique menu item ID */
  id: string;

  /** ID of the restaurant */
  restaurantId: string;

  /** Menu item name */
  name: string;

  /** Optional description */
  description?: string;

  /** Category (e.g. Starter, Main) */
  category: string;

  /** Price of the item */
  price: number;

  /** Optional image URL */
  imageUrl?: string;

  /** Whether the item is available */
  isAvailable: boolean;

  /** ISO timestamp when created */
  createdAt: string;

  /** ISO timestamp when updated */
  updatedAt: string;
}

/**
 * Response for menu items.
 */
export interface MenuItemListResponse {
  /** List of menu items */
  data: MenuItem[];
}
