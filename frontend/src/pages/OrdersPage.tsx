/**
 * @file OrdersPage.tsx
 * @description Menu and ordering page for a selected restaurant.
 * Displays food and drinks tabs, manages a cart, and handles checkout.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShoppingCart,
  UtensilsCrossed,
  GlassWater,
  ArrowLeft,
} from "lucide-react";
import { useCreateOrder } from "../api/ordershooks";
import {
  restaurantsApi,
  menuApi,
  type MenuItem,
  type Restaurant,
} from "../api";

/** A product with a quantity, used in the cart */
type CartItem = MenuItem & { quantity: number };

/**
 * Orders page for a selected restaurant.
 *
 * Displays the restaurant menu, allows users to add items to a cart,
 * review their order, and submit the order through the API.
 *
 * Features:
 * - Food and drinks menu tabs
 * - Cart management with quantity updates
 * - Checkout modal
 * - Order submission using the orders API
 *
 * Route parameters:
 * - `id` — identifier of the restaurant whose menu is being displayed
 *
 * @returns React page component rendering the restaurant ordering interface.
 */
export default function OrdersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: createOrder, isPending } = useCreateOrder();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<"food" | "drinks">("food");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Loads restaurant details and menu items.
     */
    const loadData = async () => {
      if (!id) {
        setError("Restaurant not found.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [restaurantResponse, menuResponse] = await Promise.all([
          restaurantsApi.getById(id),
          menuApi.getAll(id, { availableOnly: true }),
        ]);

        setRestaurant(restaurantResponse);
        setMenuItems(menuResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [id]);

  /**
   * Whether a category should be treated as a drink.
   *
   * @param category - Menu item category
   * @returns True if category is drink-related
   */
  const isDrinkCategory = (category: string): boolean => {
    const normalized = category.toLowerCase();
    return (
      normalized.includes("drink") ||
      normalized.includes("beverage") ||
      normalized.includes("coffee") ||
      normalized.includes("tea") ||
      normalized.includes("juice") ||
      normalized.includes("water")
    );
  };

  const products = useMemo(() => {
    return menuItems.filter((item) =>
      activeTab === "food"
        ? !isDrinkCategory(item.category)
        : isDrinkCategory(item.category),
    );
  }, [menuItems, activeTab]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  /**
   * Adds one unit of a product to the cart.
   *
   * @param product - Menu item to add
   */
  function addToCart(product: MenuItem) {
    setOrderPlaced(false);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  }

  /**
   * Removes one unit of a product from the cart.
   *
   * @param productId - Menu item ID
   */
  function removeOne(productId: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  /**
   * Submits the current cart as an order.
   */
  function confirmOrder() {
    if (!id) return;

    createOrder(
      {
        restaurantId: id,
        customerName: "Guest",
        customerEmail: "guest@example.com",
        items: cart.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
        })),
      },
      {
        onSuccess: () => {
          setOrderPlaced(true);
          setCart([]);
          setShowCheckout(false);
        },
        onError: (err: Error) => {
          console.error("Order failed:", err);
          alert("Failed to place order. Please try again.");
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Loading restaurant...
        </h2>
      </div>
    );
  }

  if (error || !restaurant || !id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-slate-800">
          {error || "Restaurant not found."}
        </h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-700 transition"
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        {" "}
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 transition-all duration-200 hover:-translate-x-0.5 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {restaurant.name}
            </h1>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold transition bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
            {totalQty > 0 ? (
              <>
                <span>
                  {totalQty} item{totalQty > 1 ? "s" : ""}
                </span>
                <span>· €{total.toFixed(2)}</span>
              </>
            ) : (
              <span>Cart</span>
            )}
          </button>
        </div>
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          {(["food", "drinks"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 px-5 py-2 text-sm font-semibold capitalize transition-all duration-200 ${activeTab === tab ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
            >
              {tab === "food" ? (
                <UtensilsCrossed size={15} />
              ) : (
                <GlassWater size={15} />
              )}
              {tab === "food" ? "Food" : "Drinks"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {orderPlaced && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 font-medium">
            Order placed! Your food is on its way.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const inCart = cart.find((item) => item.id === product.id);

            return (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      No image available
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                    {product.name}
                  </h2>
                  <p className="mt-1 flex-1 text-sm leading-snug text-slate-500 dark:text-slate-400">
                    {product.description || "No description available."}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      €{product.price.toFixed(2)}
                    </span>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeOne(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg font-bold transition-all duration-200 hover:scale-105 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                          −
                        </button>
                        <span className="w-5 text-center font-semibold text-slate-900 dark:text-slate-100">
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-8 h-8 rounded-full text-white transition font-bold text-lg flex items-center justify-center bg-slate-900 hover:bg-slate-800"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-1.5 rounded-full text-white text-sm font-semibold transition bg-slate-900 hover:bg-slate-800"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 text-slate-600">
            No items found in this tab.
          </div>
        )}
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4">
              <h2 className="text-lg font-bold text-white">
                Your Order — {restaurant.name}
              </h2>
            </div>
            <div className="px-6 py-4 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <p className="py-4 text-center text-slate-500 dark:text-slate-400">
                  Your cart is empty.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        x{item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                      €{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            )}
            <div className="flex gap-3 px-6 py-4">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Keep browsing
              </button>
              <button
                onClick={confirmOrder}
                disabled={cart.length === 0 || isPending}
                className="flex-1 py-3 rounded-xl text-white font-bold transition bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? "Placing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
