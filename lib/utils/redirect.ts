/**
 * Validates that a redirect URL is safe (internal only).
 * Prevents open redirect attacks by only allowing relative paths.
 */
export function getSafeRedirect(url: string | null): string {
  const fallback = "/";

  if (!url) {
    return fallback;
  }

  // Only allow relative paths that start with a single slash
  // Reject protocol-relative URLs (//evil.com) and absolute URLs
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  return fallback;
}
