import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, X } from "lucide-react";

/**
 * Represents a restaurant card shown on the Restaurants page.
 */
type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  area: string;
  etaMins: number;
  price: "€" | "€€" | "€€€";
  rating: number;
  blurb: string;
  tags: string[];
  image: string;
};

/** Hard-coded restaurant catalogue. */
const restaurants: Restaurant[] = [
  {
    id: "luna",
    name: "Luna Pasta Bar",
    cuisine: "Italian",
    area: "Dublin 2",
    etaMins: 25,
    price: "€€",
    rating: 4.6,
    blurb: "Fresh pasta, small plates, and a great wine list.",
    tags: ["Pasta", "Wine", "Date night"],
    image:
      "https://images.unsplash.com/photo-1608756687911-aa1599ab3bd9?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "saffron",
    name: "Saffron House",
    cuisine: "Indian",
    area: "Ranelagh",
    etaMins: 35,
    price: "€€",
    rating: 4.5,
    blurb: "Big flavours: tandoor specials, curries, and naan.",
    tags: ["Spicy", "Tandoor", "Comfort"],
    image:
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "kyoto",
    name: "Kyoto Kitchen",
    cuisine: "Japanese",
    area: "Temple Bar",
    etaMins: 30,
    price: "€€€",
    rating: 4.7,
    blurb: "Sushi, ramen, and izakaya-style bites done properly.",
    tags: ["Sushi", "Ramen", "Izakaya"],
    image:
      "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "camino",
    name: "El Camino",
    cuisine: "Mexican",
    area: "Smithfield",
    etaMins: 20,
    price: "€€",
    rating: 4.4,
    blurb: "Tacos, burritos, nachos — fast, loud, and tasty.",
    tags: ["Tacos", "Burritos", "Street food"],
    image:
      "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "greenbowl",
    name: "Green Bowl",
    cuisine: "Healthy",
    area: "Grand Canal",
    etaMins: 18,
    price: "€€",
    rating: 4.3,
    blurb: "Protein bowls, salads, and smoothies — quick & clean.",
    tags: ["Bowls", "Salads", "High-protein"],
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "forge",
    name: "Burger Forge",
    cuisine: "American",
    area: "Dublin 1",
    etaMins: 22,
    price: "€",
    rating: 4.2,
    blurb: "Smash burgers, crispy fries, and proper shakes.",
    tags: ["Burgers", "Fries", "Shakes"],
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=60",
  },
];

/**
 * RestaurantsPage
 *
 * Displays a list of restaurants and lets the user filter them by
 * free-text search and cuisine dropdown.
 */
export function RestaurantsPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("All");

  const cuisines = useMemo(() => {
    const unique = Array.from(new Set(restaurants.map((r) => r.cuisine)));
    return ["All", ...unique];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return restaurants
      .filter((r) => cuisine === "All" || r.cuisine === cuisine)
      .filter((r) => {
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [query, cuisine]);

  const goToMenu = (r: Restaurant) => {
    navigate(`/menu/${r.id}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Choose a restaurant
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Pick one to view the menu and start your order.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto sm:flex-row">
            <div className="relative w-full sm:w-80">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, area, or tag…"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-md outline-none transition-colors focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-slate-700"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-md outline-none transition-colors focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700"
            >
              {cuisines.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => goToMenu(r)}
              className="group overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={r.image}
                  alt={r.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {r.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {r.cuisine} • {r.area}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs text-white dark:bg-slate-100 dark:text-slate-900">
                    {r.price}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {r.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Clock size={11} />
                    {r.etaMins} mins
                  </span>
                </div>

                <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">
                  {r.blurb}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {r.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    View menu →
                  </span>
                  <span className="text-sm text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                    Tap to continue
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              No results
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Try a different search term or reset filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCuisine("All");
              }}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RestaurantsPage;
