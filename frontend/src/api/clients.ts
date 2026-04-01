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
  const token = localStorage.getItem("authToken");

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("API error body:", text);
    throw new Error(text || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
