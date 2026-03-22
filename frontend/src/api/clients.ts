/**
 * Base URL for API requests.
 * Defaults to localhost backend if env variable is not set.
 */
const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:8080/api";

/**
 * Generic API fetch wrapper.
 *
 * Automatically:
 * - prefixes base URL
 * - attaches JSON headers
 * - includes JWT token if present
 *
 * @template T expected response type
 * @param path endpoint path (e.g. /restaurants)
 * @param options fetch options
 * @returns parsed JSON response
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  // Handle empty responses (e.g. DELETE 204)
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}