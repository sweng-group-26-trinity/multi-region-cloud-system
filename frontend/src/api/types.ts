/**
 * Represents a restaurant entity.
 */
export interface Restaurant {
  /** Unique restaurant ID */
  id: string;

  /** Display name of the restaurant */
  name: string;

  /** Brief description of the restaurant */
  description: string;

  /** Physical address of the restaurant */
  address: string;

  /** Contact phone number */
  phone: string;

  /** Contact email address */
  email: string;

  /** URL of the restaurant's main display image */
  imageUrl?: string;

  /** URL of the restaurant's logo */
  logoUrl?: string;

  /** Type of cuisine served */
  cuisineType: string;

  /** Business opening hours */
  openingHours: string;

  /** Owner user ID */
  ownerId: string;

  /** Whether the restaurant is active */
  isActive: boolean;

  /** ISO timestamp when the restaurant was created */
  createdAt: string;

  /** ISO timestamp when the restaurant was last updated */
  updatedAt: string;
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
 * Response for restaurant list (paginated).
 */
export interface RestaurantPage {
  /** List of restaurants */
  content: Restaurant[];

  /** Total number of restaurants */
  totalElements: number;

  /** Total pages */
  totalPages: number;

  /** Current page (0-indexed) */
  number: number;

  /** Page size */
  size: number;
}

/**
 * Response for menu items.
 */
export interface MenuItemListResponse {
  /** List of menu items */
  data: MenuItem[];
}

/**
 * Represents an order item.
 */
export interface OrderItem {
  /** Menu item ID */
  itemId: string;

  /** Item name */
  name: string;

  /** Quantity ordered */
  quantity: number;

  /** Price per unit */
  unitPrice: number;

  /** Subtotal */
  subtotal: number;
}

/**
 * Represents an order.
 */
export interface Order {
  /** Order ID */
  id: string;

  /** Restaurant ID */
  restaurantId: string;

  /** Customer ID */
  customerId?: string;

  /** Customer name */
  customerName: string;

  /** Customer email */
  customerEmail: string;

  /** Items in the order */
  items: OrderItem[];

  /** Order status */
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";

  /** Total amount */
  totalAmount: number;

  /** Special instructions */
  specialInstructions?: string;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Request payload for creating an order.
 */
export interface CreateOrderRequest {
  /** Restaurant ID */
  restaurantId: string;

  /** Optional customer name */
  customerName?: string;

  /** Optional customer email */
  customerEmail?: string;

  /** Items being ordered */
  items: {
    itemId: string;
    quantity: number;
  }[];

  /** Optional instructions */
  specialInstructions?: string;
}

/**
 * Request payload for updating an order.
 */
export interface UpdateOrderRequest {
  customerName?: string;
  customerEmail?: string;
  items?: {
    itemId: string;
    quantity: number;
  }[];
  status?: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  specialInstructions?: string;
}

/**
 * Represents an API error response.
 */
export interface ApiError {
  /** Human-readable error message */
  message: string;

  /** HTTP status code */
  status: number;

  /** Optional validation errors */
  errors?: Record<string, string[]>;
}