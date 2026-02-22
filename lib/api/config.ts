const LOCAL_API_FALLBACK = "http://127.0.0.1:8787";
const LOCAL_AUTH_BASE = "http://127.0.0.1:8787/auth";

function withNoTrailingSlash(input: string): string {
  return input.replace(/\/+$/, "");
}

export function getBrowserApiAuthBaseUrl(): string {
  return withNoTrailingSlash(
    process.env.NEXT_PUBLIC_API_AUTH_BASE ?? LOCAL_AUTH_BASE,
  );
}

export function getServerApiBaseUrl(): string {
  const url =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? LOCAL_API_FALLBACK;

  if (!url) {
    throw new Error("Missing API base URL.");
  }

  return withNoTrailingSlash(url);
}
