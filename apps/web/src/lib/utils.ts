/**
 * @file apps/web/src/lib/utils.ts
 * @description Layer 4: Infrastructure & Shared Utilities.
 * Common helper functions for class name concatenation and string truncation.
 */

/**
 * Merges conditional class names into a single clean string.
 *
 * @param inputs - List of class names, booleans, undefined, or null values.
 * @returns Combined class names string.
 */
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  // Step 1: Filter out falsy values and join with a single whitespace
  return inputs.filter(Boolean).join(" ");
}

/**
 * Truncates a string by preserving head and tail segments with an ellipsis in the middle.
 *
 * @param str - Input string to truncate or null/undefined.
 * @param chars - Number of characters to retain at the start and end (default: 4).
 * @returns Truncated string (e.g., "abcd...wxyz") or original/empty string.
 */
export function truncateMiddle(str: string | null | undefined, chars: number = 4): string {
  // Step 1: Validate string existence and minimum length
  if (!str) return "";
  if (str.length <= chars * 2) return str;

  // Step 2: Slice head and tail segments around ellipsis
  const prefix = str.slice(0, chars);
  const suffix = str.slice(-chars);
  return `${prefix}...${suffix}`;
}

