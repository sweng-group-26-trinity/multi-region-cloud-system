import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, X } from "lucide-react";
import { restaurantsApi, type Restaurant } from "../api";

/**
 * RestaurantPage
 *
 * Displays a list of restaurants and lets the user filter them by
 * free-text search and cuisine dropdown.
 */
export function RestaurantPage() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Loads restaurants from the backend.
     */
    const loadRestaurants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await restaurantsApi.getAll({ page: 0, size: 100 });
        setRestaurants(response.content);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load restaurants",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadRestaurants();
  }, []);

  const cuisines = useMemo(() => {
    const unique = Array.from(
      new Set(
        restaurants
          .map((restaurant) => restaurant.cuisineType)
          .filter((value) => Boolean(value)),
      ),
    );
    return ["All", ...unique];
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return restaurants
      .filter((restaurant) => restaurant.isActive)
      .filter(
        (restaurant) =>
          cuisine === "All" || restaurant.cuisineType === cuisine,
      )
      .filter((restaurant) => {
        if (!q) return true;

        return (
          restaurant.name.toLowerCase().includes(q) ||
          restaurant.address.toLowerCase().includes(q) ||
          restaurant.cuisineType.toLowerCase().includes(q) ||
          restaurant.description.toLowerCase().includes(q)
        );
      });
  }, [restaurants, query, cuisine]);

  /**
   * Navigates to the selected restaurant menu page.
   *
   * @param restaurant - Selected restaurant
   */
  const goToMenu = (restaurant: Restaurant) => {
    navigate(`/menu/${restaurant.id}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
              Choose a restaurant
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Pick one to view the menu and start your order.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <div className="relative w-full sm:w-80">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, address, or cuisine…"
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
              className="rounded-full px-4 py-2 shadow-sm border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            >
              {cuisines.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Loading restaurants...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="mt-10 rounded-3xl border border-red-200 bg-white p-6 shadow-md dark:border-red-900 dark:bg-slate-900">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Could not load restaurants
            </p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((restaurant) => (
              <button
                key={restaurant.id}
                type="button"
                onClick={() => goToMenu(restaurant)}
                className="group overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {restaurant.imageUrl ? (
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                      No image available
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {restaurant.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {restaurant.cuisineType} • {restaurant.address}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Clock size={11} />
                      {restaurant.openingHours || "Opening hours unavailable"}
                    </span>
                  </div>

                  <p className="mt-4 leading-relaxed text-slate-700 dark:text-slate-300">
                    {restaurant.description || "No description available."}
                  </p>

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

        {!isLoading && !error && filtered.length === 0 && (
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

export default RestaurantPage;