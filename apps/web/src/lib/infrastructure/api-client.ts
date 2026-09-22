/**
 * @file apps/web/src/lib/infrastructure/api-client.ts
 * @description Layer 4: Infrastructure - Application API Client & Environment Configuration.
 * Configures the canonical API base URL, request options, and environment resolution.
 */

/**
 * Default fallback API base URL for local development.
 */
export const DEFAULT_API_BASE_URL = "http://localhost:3001";

/**
 * Resolves the active base URL for API communication.
 * Prioritizes NEXT_PUBLIC_API_URL, then NEXT_PUBLIC_SITE_URL, falling back to localhost.
 *
 * @returns {string} The canonical base URL string.
 */
export function getApiBaseUrl(): string {
  // Step 1: Check public API url environment variable
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredApiUrl && configuredApiUrl.trim().length > 0) {
    return configuredApiUrl.trim().replace(/\/+$/, "");
  }

  // Step 2: Check public site url environment variable
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl && siteUrl.trim().length > 0) {
    return siteUrl.trim().replace(/\/+$/, "");
  }

  // Step 3: Fall back to canonical local development base URL
  return DEFAULT_API_BASE_URL;
}

/**
 * Generates an absolute API endpoint URL from a relative path.
 *
 * @param path - Relative API endpoint path (e.g., "/api/health").
 * @returns {string} Fully qualified absolute URL string.
 */
export function getApiEndpointUrl(path: string): string {
  // Step 1: Normalize leading slash on path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Step 2: Combine resolved base URL with path
  const base = getApiBaseUrl();
  return `${base}${normalizedPath}`;
}
