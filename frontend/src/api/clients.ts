/**
 * Base URL for API requests.
 *
 * Uses the Vite environment variable if available,
 * otherwise falls back to a local development URL.
 */
const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:8080/api";

/**
 * Performs a typed HTTP request to the API.
 * @param url - API endpoint path
 * @param options - Fetch request options
 * @returns Parsed JSON response
 * @throws Error if the response is not OK
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
