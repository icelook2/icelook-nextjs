/**
 * Utility for constructing Supabase Storage URLs at runtime.
 *
 * Best Practice: Store only the storage path in the database, not full URLs.
 * This makes the database environment-agnostic (same data works in dev/staging/prod).
 *
 * @example
 * // Database stores: "user-id/beauty-pages/bp-id/avatar/image.png"
 * // At runtime: getStorageUrl(path) → "http://127.0.0.1:54421/storage/v1/object/public/user-content/..."
 */

const DEFAULT_BUCKET = "user-content";

// Capture env var at module load time to ensure it's available
// NEXT_PUBLIC_ vars are inlined at build time by Next.js
const SUPABASE_URL = process.env.NEXT_PUBLIC_IL_SUPABASE_URL ?? "";

/**
 * Constructs a full Supabase Storage URL from a storage path.
 *
 * @param path - The storage path (e.g., "user-id/avatar/image.png")
 * @param bucket - The storage bucket (defaults to "user-content")
 * @returns Full URL to the stored object
 *
 * @example
 * getStorageUrl("abc/avatar/image.png")
 * // → "http://127.0.0.1:54421/storage/v1/object/public/user-content/abc/avatar/image.png"
 */
export function getStorageUrl(
  path: string,
  bucket: string = DEFAULT_BUCKET,
): string {
  if (!SUPABASE_URL) {
    console.warn("NEXT_PUBLIC_IL_SUPABASE_URL is not set");
    return "";
  }

  const url = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  console.log("[getStorageUrl]", { path, url, SUPABASE_URL });
  return url;
}
