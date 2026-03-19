/**
 * @file OrdersPage.tsx
 * @description Menu and ordering page for a selected restaurant.
 * Displays food and drinks tabs, manages a cart, and handles checkout.
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShoppingCart,
  UtensilsCrossed,
  GlassWater,
  PartyPopper,
  ArrowLeft,
} from "lucide-react";
import { useCreateOrder } from "../api/ordershooks";

/** A single menu item */
type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
};

/** A product with a quantity, used in the cart */
type CartItem = Product & { quantity: number };

const restaurantMeta: Record<
  string,
  { name: string; btnClass: string; headerClass: string }
> = {
  luna: {
    name: "Luna Pasta Bar",
    btnClass: "bg-orange-500 hover:bg-orange-600",
    headerClass: "bg-orange-500",
  },
  saffron: {
    name: "Saffron House",
    btnClass: "bg-amber-600 hover:bg-amber-700",
    headerClass: "bg-amber-600",
  },
  kyoto: {
    name: "Kyoto Kitchen",
    btnClass: "bg-rose-600 hover:bg-rose-700",
    headerClass: "bg-rose-600",
  },
  camino: {
    name: "El Camino",
    btnClass: "bg-green-600 hover:bg-green-700",
    headerClass: "bg-green-600",
  },
  greenbowl: {
    name: "Green Bowl",
    btnClass: "bg-lime-600 hover:bg-lime-700",
    headerClass: "bg-lime-600",
  },
  forge: {
    name: "Burger Forge",
    btnClass: "bg-red-600 hover:bg-red-700",
    headerClass: "bg-red-600",
  },
};

const foodMenus: Record<string, Product[]> = {
  luna: [
    {
      id: 1,
      name: "Cacio e Pepe",
      description:
        "Tonnarelli pasta, aged pecorino, coarsely cracked black pepper.",
      price: 13.5,
      image:
        "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80",
    },
    {
      id: 2,
      name: "Penne Arrabbiata",
      description: "San Marzano tomatoes, garlic, chilli, fresh basil.",
      price: 11.5,
      image:
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80",
    },
    {
      id: 3,
      name: "Truffle Risotto",
      description:
        "Carnaroli rice, black truffle, parmesan, white wine reduction.",
      price: 16.0,
      image:
        "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80",
    },
    {
      id: 4,
      name: "Margherita Pizza",
      description:
        "San Marzano base, fior di latte, fresh basil, extra-virgin olive oil.",
      price: 12.5,
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80",
    },
    {
      id: 5,
      name: "Burrata Starter",
      description:
        "Creamy burrata, heirloom tomatoes, pesto, toasted pine nuts.",
      price: 9.5,
      image:
        "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600&q=80",
    },
    {
      id: 6,
      name: "Tiramisu",
      description:
        "Espresso-soaked ladyfingers, mascarpone cream, cocoa dusting.",
      price: 7.5,
      image:
        "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80",
    },
  ],
  saffron: [
    {
      id: 10,
      name: "Butter Chicken",
      description:
        "Tender chicken in a rich tomato-cream sauce with fenugreek.",
      price: 13.99,
      image:
        "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80",
    },
    {
      id: 11,
      name: "Lamb Rogan Josh",
      description:
        "Slow-braised Kashmiri lamb, whole spices, fried onion gravy.",
      price: 15.99,
      image:
        "https://images.unsplash.com/photo-1545247181-516773cae754?w=600&q=80",
    },
    {
      id: 12,
      name: "Vegetable Biryani",
      description:
        "Basmati rice layered with spiced seasonal vegetables and saffron.",
      price: 12.5,
      image:
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80",
    },
    {
      id: 13,
      name: "Garlic Naan",
      description:
        "Leavened flatbread, roasted garlic butter, fresh coriander.",
      price: 3.5,
      image:
        "https://images.unsplash.com/photo-1697155406014-04dc649b0953?w=600&q=80",
    },
    {
      id: 14,
      name: "Samosa (3 pcs)",
      description:
        "Crispy pastry filled with spiced potato and peas, mint chutney.",
      price: 6.5,
      image:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
    },
    {
      id: 15,
      name: "Mango Kulfi",
      description:
        "Traditional Indian ice cream with alphonso mango and pistachios.",
      price: 5.99,
      image:
        "https://images.unsplash.com/photo-1639771884984-88fa62ac7e19?w=600&q=80",
    },
  ],
  kyoto: [
    {
      id: 20,
      name: "Salmon Nigiri (4)",
      description: "Hand-pressed sushi rice topped with fresh Atlantic salmon.",
      price: 10.99,
      image:
        "https://images.unsplash.com/photo-1760903124403-9d0d36867720?w=600&q=80",
    },
    {
      id: 21,
      name: "Sushi Platter",
      description:
        "Chef's selection of nigiri, maki and sashimi, beautifully presented.",
      price: 22.99,
      image:
        "https://images.unsplash.com/photo-1562802378-063ec186a863?w=600&q=80",
    },
    {
      id: 22,
      name: "Tonkotsu Ramen",
      description: "Rich prawn broth, prawns, soft egg, nori, bamboo shoots.",
      price: 14.99,
      image:
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
    },
    {
      id: 23,
      name: "Chicken Karaage",
      description: "Japanese fried chicken thighs, kewpie mayo, lemon wedge.",
      price: 10.5,
      image:
        "https://images.unsplash.com/photo-1606502973842-f64bc2785fe5?w=600&q=80",
    },
    {
      id: 24,
      name: "Gyoza (6 pcs)",
      description: "Pan-fried pork and cabbage dumplings, ponzu dipping sauce.",
      price: 8.5,
      image:
        "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&q=80",
    },
    {
      id: 25,
      name: "Mochi Ice Cream",
      description:
        "Three-piece selection: matcha, strawberry, and black sesame.",
      price: 6.5,
      image:
        "https://plus.unsplash.com/premium_photo-1700590072629-c051ca7ce0f3?w=600&q=80",
    },
  ],
  camino: [
    {
      id: 30,
      name: "Beef Tacos (3)",
      description:
        "Slow-cooked barbacoa beef, pickled onion, salsa verde, cotija.",
      price: 11.99,
      image:
        "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80",
    },
    {
      id: 31,
      name: "Chicken Burrito",
      description:
        "Grilled chicken, rice, black beans, guacamole, pico de gallo.",
      price: 12.99,
      image:
        "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80",
    },
    {
      id: 32,
      name: "Loaded Nachos",
      description:
        "Tortilla chips, cheddar, jalapeños, sour cream, guacamole, salsa.",
      price: 9.99,
      image:
        "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80",
    },
    {
      id: 33,
      name: "Churros and Dip",
      description:
        "Cinnamon-sugar churros with warm dark chocolate dipping sauce.",
      price: 6.5,
      image:
        "https://plus.unsplash.com/premium_photo-1713687789756-b38c7870eef6?w=600&q=80",
    },
    {
      id: 34,
      name: "Elote Corn",
      description: "Grilled corn on the cob, mayo, chilli, cotija, lime.",
      price: 5.5,
      image:
        "https://plus.unsplash.com/premium_photo-1680118540055-aa9f6ce1d93d?w=600&q=80",
    },
    {
      id: 35,
      name: "Guac and Chips",
      description:
        "House-made guacamole, tomato, coriander, served with tortilla chips.",
      price: 6.99,
      image:
        "https://images.unsplash.com/photo-1595016111459-799a195e7452?w=600&q=80",
    },
  ],
  greenbowl: [
    {
      id: 40,
      name: "Chicken Protein Bowl",
      description:
        "Grilled chicken, quinoa, roasted sweet potato, avocado, tahini.",
      price: 13.5,
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    },
    {
      id: 41,
      name: "Vegan Buddha Bowl",
      description:
        "Falafel, hummus, tabbouleh, roasted veg, pomegranate seeds.",
      price: 12.99,
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    },
    {
      id: 42,
      name: "Prawn and Leaf Salad",
      description:
        "Prawns, watermelon, mixed leaves, cucumber, lemon dressing.",
      price: 11.5,
      image:
        "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80",
    },
    {
      id: 43,
      name: "Berry Smoothie Bowl",
      description:
        "Blended acai, banana, topped with granola, blueberry, honey.",
      price: 8.99,
      image:
        "https://images.unsplash.com/photo-1590301157411-8686d4a34f10?w=600&q=80",
    },
    {
      id: 44,
      name: "Avocado Toast",
      description: "Sourdough, smashed avo, poached egg, chilli flakes, seeds.",
      price: 9.5,
      image:
        "https://images.unsplash.com/photo-1687276287139-88f7333c8ca4?w=600&q=80",
    },
    {
      id: 45,
      name: "Energy Balls (4)",
      description: "Oat, almond butter, dark chocolate chip, medjool date.",
      price: 5.99,
      image:
        "https://images.unsplash.com/photo-1716392916280-e17fb5a2c191?w=600&q=80",
    },
  ],
  forge: [
    {
      id: 50,
      name: "Smash Cheeseburger",
      description:
        "Double smash patty, American cheese, pickles, mustard, brioche.",
      price: 10.99,
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    },
    {
      id: 51,
      name: "BBQ Bacon Burger",
      description:
        "Beef patty, streaky bacon, BBQ sauce, crispy onions, cheddar.",
      price: 12.5,
      image:
        "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80",
    },
    {
      id: 52,
      name: "Parmesan Fries",
      description:
        "Skin-on fries, grated parmesan, garlic, fresh parsley, aioli.",
      price: 6.99,
      image:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80",
    },
    {
      id: 53,
      name: "Crispy Chicken Wrap",
      description:
        "Fried chicken thigh, sriracha slaw, pickles, garlic mayo, wrap.",
      price: 10.5,
      image:
        "https://images.unsplash.com/photo-1632660346941-023cc64e1252?w=600&q=80",
    },
    {
      id: 54,
      name: "Mac and Cheese",
      description: "Four-cheese sauce, macaroni, toasted breadcrumb crust.",
      price: 7.5,
      image:
        "https://images.unsplash.com/photo-1708184528301-b0dad28dded5?w=600&q=80",
    },
    {
      id: 55,
      name: "Brownie Sundae",
      description:
        "Warm chocolate brownie, vanilla ice cream, hot fudge, cream.",
      price: 6.99,
      image:
        "https://images.unsplash.com/photo-1648857529887-28d03f6774ea?w=600&q=80",
    },
  ],
};

const drinks: Product[] = [
  {
    id: 100,
    name: "Still Water (500ml)",
    description: "Chilled still mineral water.",
    price: 2.0,
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80",
  },
  {
    id: 101,
    name: "Sparkling Water (500ml)",
    description: "Lightly carbonated mineral water.",
    price: 2.5,
    image:
      "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=600&q=80",
  },
  {
    id: 102,
    name: "Coca-Cola (330ml)",
    description: "Ice-cold classic Coca-Cola.",
    price: 3.0,
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  },
  {
    id: 103,
    name: "Fresh Lemonade",
    description: "House-squeezed lemonade with mint and ice.",
    price: 3.5,
    image:
      "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80",
  },
  {
    id: 104,
    name: "Flat White",
    description: "Double shot espresso, steamed whole milk.",
    price: 3.2,
    image:
      "https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?w=600&q=80",
  },
  {
    id: 105,
    name: "Craft Lager (330ml)",
    description: "Cold-filtered Irish craft lager, 4.5% ABV.",
    price: 5.0,
    image:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80",
  },
  {
    id: 106,
    name: "House Red Wine (175ml)",
    description: "Smooth Merlot from the south of France.",
    price: 7.5,
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
  },
];
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

  const [activeTab, setActiveTab] = useState<"food" | "drinks">("food");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const meta = id ? restaurantMeta[id] : undefined;

  if (!meta || !id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Restaurant not found.
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

  const products = activeTab === "food" ? (foodMenus[id] ?? []) : drinks;
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  function addToCart(product: Product) {
    setOrderPlaced(false);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function removeOne(productId: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  function confirmOrder() {
    createOrder(
      {
        restaurantId: id!,
        customerName: "Guest",
        customerEmail: "guest@example.com",
        items: cart.map((item) => ({
          itemId: String(item.id),
          quantity: item.quantity,
        })),
      },
      {
        onSuccess: () => {
          setOrderPlaced(true);
          setCart([]);
          setShowCheckout(false);
        },
        onError: (err) => {
          console.error("Order failed:", err);
          alert("Failed to place order. Please try again.");
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-slate-500 hover:text-slate-900 transition text-sm font-medium flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="text-xl font-bold text-slate-900">{meta.name}</h1>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold transition ${meta.btnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
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
              className={`capitalize px-5 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${activeTab === tab ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}
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
            <PartyPopper size={22} />
            Order placed! Your food is on its way.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const inCart = cart.find((i) => i.id === product.id);
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
              >
                <div className="h-44 overflow-hidden bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="font-semibold text-slate-900">
                    {product.name}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1 leading-snug flex-1">
                    {product.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      €{product.price.toFixed(2)}
                    </span>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeOne(product.id)}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition font-bold text-lg flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-5 text-center font-semibold">
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          className={`w-8 h-8 rounded-full text-white transition font-bold text-lg flex items-center justify-center ${meta.btnClass}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className={`px-4 py-1.5 rounded-full text-white text-sm font-semibold transition ${meta.btnClass}`}
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
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className={`${meta.headerClass} px-6 py-4`}>
              <h2 className="text-lg font-bold text-white">
                Your Order — {meta.name}
              </h2>
            </div>
            <div className="px-6 py-4 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <p className="text-slate-500 py-4 text-center">
                  Your cart is empty.
                </p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-slate-500 text-sm">x{item.quantity}</p>
                    </div>
                    <span className="font-semibold text-slate-900 shrink-0">
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
            <div className="px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition font-semibold text-slate-700"
              >
                Keep browsing
              </button>
              <button
                onClick={confirmOrder}
                disabled={cart.length === 0 || isPending}
                className={`flex-1 py-3 rounded-xl text-white font-bold transition ${meta.btnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
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
