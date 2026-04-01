import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { restaurantsApi } from "../api/restaurants";
import { menuApi } from "../api/menu";
import { useCreateOrder } from "../api/ordershooks";
import { useAuth } from "@/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type MenuItem = {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
};

type CartItem = MenuItem & { quantity: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive a stable Tailwind accent colour from a restaurant ID string. */
function accentFromId(id: string): { btn: string; header: string } {
  const palettes = [
    { btn: "bg-orange-500 hover:bg-orange-600", header: "bg-orange-500" },
    { btn: "bg-rose-600 hover:bg-rose-700", header: "bg-rose-600" },
    { btn: "bg-amber-600 hover:bg-amber-700", header: "bg-amber-600" },
    { btn: "bg-teal-600 hover:bg-teal-700", header: "bg-teal-600" },
    { btn: "bg-violet-600 hover:bg-violet-700", header: "bg-violet-600" },
    { btn: "bg-green-600 hover:bg-green-700", header: "bg-green-600" },
  ];
  const index =
    id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    palettes.length;
  return palettes[index]!;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Orders page for a selected restaurant.
 *
 * Fetches the restaurant details and its full menu from the API.
 * Groups menu items by category (tabs). Allows the user to build a
 * cart and submit the order via the orders API.
 *
 * Route parameters:
 * - `id` — restaurant UUID
 */
export default function OrdersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const accent = id ? accentFromId(id) : accentFromId("default");

  // ── Fetch restaurant ───────────────────────────────────────────────────────
  const {
    data: restaurant,
    isLoading: loadingRestaurant,
    isError: errorRestaurant,
  } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => restaurantsApi.getById(id!),
    enabled: !!id,
  });

  // ── Fetch menu ─────────────────────────────────────────────────────────────
  const {
    data: menuData,
    isLoading: loadingMenu,
    isError: errorMenu,
  } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => menuApi.getAll(id!),
    enabled: !!id,
  });

  const allItems: MenuItem[] = useMemo(
    () => (menuData?.data ?? []).filter((i) => i.isAvailable),
    [menuData],
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allItems.map((i) => i.category)));
    // Sort: put common appetisers first, mains, then drinks/desserts last
    const order = ["Starter", "Main", "Side", "Dessert", "Drink"];
    return cats.sort(
      (a, b) =>
        (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
        (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
    );
  }, [allItems]);

  // Set default category once categories are available
  const currentCategory =
    activeCategory && categories.includes(activeCategory)
      ? activeCategory
      : (categories[0] ?? null);

  const products = useMemo(
    () => allItems.filter((i) => i.category === currentCategory),
    [allItems, currentCategory],
  );

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing)
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeOne(itemId: string) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0),
    );
  }

  // ── Order submission ───────────────────────────────────────────────────────
  const createOrder = useCreateOrder();

  async function confirmOrder() {
    if (!id || cart.length === 0) return;

    setShowCheckout(false);
    navigate("/order-summary", {
      state: {
        restaurantName: restaurant?.name ?? "",
        items: cart,
        total,
      },
    });
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  const isLoading = loadingRestaurant || loadingMenu;
  const isError = errorRestaurant || errorMenu;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm">Loading menu…</p>
      </div>
    );
  }

  if (isError || !restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <AlertCircle size={28} className="text-red-500" />
        <p className="font-semibold">Restaurant not found.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-xl bg-slate-900 px-5 py-2 text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
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
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${accent.btn} disabled:cursor-not-allowed disabled:opacity-40`}
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

        {/* ── Category tabs ── */}
        {categories.length > 0 && (
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 border-b-2 px-5 py-2 text-sm font-semibold capitalize transition-all duration-200 ${
                  currentCategory === cat
                    ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Product grid ── */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {products.length === 0 ? (
          <p className="text-center text-sm text-slate-400 dark:text-slate-600">
            No items in this category.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const inCart = cart.find((c) => c.id === product.id);
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
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                      {product.name}
                    </h2>
                    <p className="mt-1 flex-1 text-sm leading-snug text-slate-500 dark:text-slate-400">
                      {product.description}
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
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-white transition-all duration-200 hover:scale-105 hover:shadow-md ${accent.btn}`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-md ${accent.btn}`}
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
        )}
      </div>

      {/* ── Checkout modal ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className={`${accent.header} px-6 py-4`}>
              <h2 className="text-lg font-bold text-white">
                Your Order — {restaurant.name}
              </h2>
            </div>

            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <p className="py-4 text-center text-slate-500 dark:text-slate-400">
                  Your cart is empty.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
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
              <div className="flex justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 font-bold text-slate-900">
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
                disabled={cart.length === 0 || createOrder.isPending}
                className={`flex-1 rounded-xl py-3 font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${accent.btn} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {createOrder.isPending ? "Placing…" : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
