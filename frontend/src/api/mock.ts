import type { Restaurant } from "./types";
import type { Order } from "./orders";
/**
 * Mock restaurant data used for development and testing.
 */
export const mockRestaurants: Restaurant[] = [
  {
    id: "1",
    name: "Pizza Palace",
    cuisine: "Italian",
    location: "New York",
    region: "us-east",
    rating: 4.5,
    description: "Best pizza in town",
    imageUrl: "https://example.com/pizza.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Sushi World",
    cuisine: "Japanese",
    location: "San Francisco",
    region: "us-west",
    rating: 4.8,
    description: "Fresh sushi daily",
    imageUrl: "https://example.com/sushi.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Mock order data used for development and testing.
 */
export const mockOrders: Order[] = [
  {
    id: "1",
    restaurantId: "1",
    customerId: "customer-1",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    status: "pending",
    totalAmount: 31.97,
    specialInstructions: undefined,
    items: [
      {
        itemId: "1",
        name: "Margherita Pizza",
        quantity: 2,
        unitPrice: 12.99,
        subtotal: 25.98,
      },
      {
        itemId: "2",
        name: "Garlic Bread",
        quantity: 1,
        unitPrice: 5.99,
        subtotal: 5.99,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Mock API for restaurants and orders.
 */
export const mockApi = {
  /** Mock restaurants API */
  restaurants: {
    /**
     * Fetches all mock restaurants
     * @returns Paginated restaurant data
     */
    getAll: async () => ({
      /** List of restaurants */
      data: mockRestaurants,
      /** Total number of restaurants */
      total: mockRestaurants.length,
      /** Current page number */
      page: 1,
      /** Page size */
      pageSize: 10,
    }),

    /**
     * Fetches a restaurant by ID
     * @param id - Restaurant ID
     * @returns The matching restaurant or undefined
     */
    getById: async (id: string) => mockRestaurants.find((r) => r.id === id),
  },

  /** Mock orders API */
  orders: {
    /**
     * Fetches all mock orders
     * @returns Paginated order data
     */
    getAll: async () => ({
      /** List of orders */
      data: mockOrders,
      /** Total number of orders */
      total: mockOrders.length,
      /** Current page number */
      page: 1,
      /** Page size */
      pageSize: 10,
    }),

    /**
     * Fetches an order by ID
     * @param id - Order ID
     * @returns The matching order or undefined
     */
    getById: async (id: string) => mockOrders.find((o) => o.id === id),
  },
};
