import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "./config";

export type ApiSession = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  session: {
    userId: string;
  };
} | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseApiSession(payload: unknown): ApiSession {
  if (!isRecord(payload)) {
    return null;
  }

  const user = payload.user;
  const session = payload.session;

  if (!isRecord(user) || !isRecord(session)) {
    return null;
  }

  if (typeof user.id !== "string" || typeof session.userId !== "string") {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: typeof user.email === "string" ? user.email : null,
      name: typeof user.name === "string" ? user.name : null,
      image: typeof user.image === "string" ? user.image : null,
    },
    session: { userId: session.userId },
  };
}

function toCookieHeader(
  cookieItems: Awaited<ReturnType<typeof cookies>>["getAll"] extends () => infer R ? R : never,
) {
  return cookieItems.map(({ name, value }) => `${name}=${value}`).join("; ");
}

export async function getApiSession(): Promise<ApiSession> {
  const cookieStore = await cookies();
  const cookieHeader = toCookieHeader(cookieStore.getAll());

  const response = await fetch(`${getServerApiBaseUrl()}/auth/get-session`, {
    method: "GET",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload: unknown = await response.json();
  return parseApiSession(payload);
}
