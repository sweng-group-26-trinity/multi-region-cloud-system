import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, Clock, X, Loader2, AlertCircle } from "lucide-react";
import { restaurantsApi } from "../api/restaurants";
import type { Restaurant } from "../api/types";

/**
 * RestaurantsPage
 *
 * Fetches restaurants from the API and lets the user filter them by
 * free-text search and cuisine type dropdown.
 */
export function RestaurantsPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [page] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["restaurants", page],
    queryFn: () => restaurantsApi.getAll({ page }),
  });

  const restaurants: Restaurant[] = data?.content ?? [];

  const cuisines = useMemo(() => {
    const unique = Array.from(new Set(restaurants.map((r) => r.cuisine)));
    return ["All", ...unique.sort()];
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return restaurants
      .filter((r) => cuisine === "All" || r.cuisine === cuisine)
      .filter((r) => {
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q)
        );
      });
  }, [query, cuisine, restaurants]);

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
                placeholder="Search by name or cuisine…"
                className="w-full rounded-full px-4 py-2 shadow-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
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
              className="rounded-full px-4 py-2 shadow-sm border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            >
              {cuisines.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="mt-20 flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">Loading restaurants…</p>
          </div>
        )}

        {isError && (
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">
              Failed to load restaurants. Please try again.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => goToMenu(r)}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {r.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {r.cuisine}
                      </p>
                    </div>
                  </div>

                  {r.openingHours && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Clock size={11} />
                        {r.openingHours}
                      </span>
                    </div>
                  )}

                  {r.description && (
                    <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300 line-clamp-2">
                      {r.description}
                    </p>
                  )}

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
        )}

        {!isLoading && !isError && filtered.length === 0 && (
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
