/**
 * Constructs the full URL for a beauty page profile.
 *
 * Uses NEXT_PUBLIC_IL_APP_URL environment variable if set,
 * otherwise falls back to localhost for development.
 */
export function getProfileUrl(nickname: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_IL_APP_URL || "http://localhost:3000";

  // Remove trailing slash if present
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return `${normalizedBaseUrl}/${nickname}`;
}
