/**
 * Represents a restaurant in the system.
 */
export interface Restaurant {
  /** Unique restaurant identifier */
  id: string;
  /** Restaurant name */
  name: string;
  /** Cuisine type (e.g. "Italian", "Japanese") */
  cuisine: string;
  /** Physical location of the restaurant */
  location?: string;
  /** Deployment region (e.g. "us-east") */
  region?: string;
  /** Average rating */
  rating?: number;
  /** Optional description */
  description?: string;
  /** Optional image URL */
  imageUrl?: string;
  /** Optional logo URL */
  logoUrl?: string;
  /** Optional street address */
  address?: string;
  /** Optional phone number */
  phone?: string;
  /** Optional contact email */
  email?: string;
  /** Optional opening hours description */
  openingHours?: string;
  /** Whether the restaurant is currently active */
  isActive?: boolean;
  /** ID of the restaurant owner */
  ownerId?: string;
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when last updated */
  updatedAt: string;
}

/**
 * Represents an API error response.
 */
export interface ApiError {
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  status: number;
  /** Optional field-level validation errors */
  errors?: Record<string, string[]>;
}

/**
 * Paginated response wrapper for list endpoints.
 */
export interface PaginatedResponse<T> {
  /** Array of items on the current page */
  content: T[];
  /** Total number of elements across all pages */
  totalElements: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number (zero-based) */
  number: number;
  /** Page size */
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
