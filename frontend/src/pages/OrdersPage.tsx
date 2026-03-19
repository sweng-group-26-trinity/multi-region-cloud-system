import { useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
};

type CartItem = Product & {
  quantity: number;
};

/**
 * Displays a restaurant ordering experience with a cart and checkout flow.
 */
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"food" | "drinks">("food");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // NOTE: These are fixed Unsplash photo IDs (more reliable than generic links)
  const food: Product[] = [
    {
      id: 1,
      name: "Burger",
      price: 8.99,
      image:
        "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      name: "Pasta",
      price: 11.99,
      image:
        "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 3,
      name: "Pizza",
      price: 12.99,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 4,
      name: "Steak",
      price: 18.99,
      image:
        "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 5,
      name: "Chips",
      price: 3.99,
      image:
        "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 6,
      name: "Chicken",
      price: 8.99,
      image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800",
    },
  ];

  const drinks: Product[] = [
    {
      id: 7,
      name: "Still Water",
      price: 2.0,
      image:
        "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 8,
      name: "Sparkling Water",
      price: 2.5,
      image:
        "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=1200&q=80",
    },

    {
      id: 9,
      name: "Fizzy Drink",
      price: 3.0,
      image:
        "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 10,
      name: "Coffee",
      price: 2.8,
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const products = activeTab === "food" ? food : drinks;

  function addToCart(product: Product) {
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

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function handleCheckout() {
    setShowCheckout(true);
  }

  function confirmOrder() {
    setOrderPlaced(true);
    setCart([]);
    setShowCheckout(false);
  }

  return (
    <div className="min-h-screen bg-white p-10">
      <h1 className="text-3xl font-bold text-orange-500 mb-8">
        Restaurant Orders
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-10">
        <button
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
            activeTab === "food" ? "bg-orange-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("food")}
        >
          Food
        </button>

        <button
         className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
            activeTab === "drinks" ? "bg-orange-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("drinks")}
        >
          Drinks
        </button>
      </div>

      {orderPlaced && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded">
          Order placed successfully!
        </div>
      )}

      <div className="flex gap-12">
        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1">
          {products.map((product) => (
            <div
              key={product.id}
             className="bg-white border rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-40 w-full object-cover"
                loading="lazy"
              />

              <div className="p-4">
                <h2 className="font-semibold text-lg">{product.name}</h2>

                <p className="text-orange-500 font-bold mt-2">
                  €{product.price.toFixed(2)}
                </p>

                <button
                  onClick={() => addToCart(product)}
                  className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-all duration-300 hover:scale-105"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-gray-50 p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Cart</h2>

          {cart.length === 0 && (
            <p className="text-gray-500">No items added yet.</p>
          )}

          {cart.map((item) => (
            <div key={item.id} className="flex justify-between mb-3">
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>€{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          {cart.length > 0 && (
            <>
              <div className="border-t pt-4 mt-6 font-bold text-lg">
                Total: €{total.toFixed(2)}
              </div>

              <button
                onClick={handleCheckout}
               className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
              >
                Checkout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Order</h2>

            {cart.map((item) => (
              <div key={item.id} className="flex justify-between mb-2">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>€{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            <div className="border-t pt-4 mt-4 font-bold">
              Total: €{total.toFixed(2)}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 bg-gray-300 py-2 rounded transition-all duration-300 hover:scale-105 hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={confirmOrder}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-all duration-300 hover:scale-105"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
