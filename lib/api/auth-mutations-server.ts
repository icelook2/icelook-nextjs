import { cookies } from "next/headers";
import { getServerApiBaseUrl } from "./config";

type AuthMutationResult =
  | { success: true }
  | { success: false; error: string };

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

function toCookieHeader(
  cookieItems: Awaited<ReturnType<typeof cookies>>["getAll"] extends () => infer R ? R : never,
) {
  return cookieItems.map(({ name, value }) => `${name}=${value}`).join("; ");
}

function getErrorMessage(status: number, fallback: string) {
  if (status === 429) {
    return "Too many attempts. Try again later.";
  }
  return fallback;
}

async function getApiErrorMessage(response: Response): Promise<string | null> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null) {
      return null;
    }

    const typedPayload = payload as ApiErrorPayload;
    if (typeof typedPayload.error === "string" && typedPayload.error.length > 0) {
      return typedPayload.error;
    }
    if (typeof typedPayload.message === "string" && typedPayload.message.length > 0) {
      return typedPayload.message;
    }
  } catch {
    return null;
  }

  return null;
}

function splitCombinedSetCookieHeader(header: string): string[] {
  return header
    .split(/,(?=\s*[A-Za-z0-9!#$%&'*+.^_`|~-]+=)/g)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function getSetCookieHeaders(response: Response): string[] {
  const headersWithGetSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithGetSetCookie.getSetCookie === "function") {
    return headersWithGetSetCookie.getSetCookie();
  }

  const combinedHeader = response.headers.get("set-cookie");
  if (!combinedHeader) {
    return [];
  }

  return splitCombinedSetCookieHeader(combinedHeader);
}

function parseSetCookieHeader(header: string): { name: string; value: string; options: CookieOptions } | null {
  const segments = header.split(";").map((segment) => segment.trim());
  const [nameValue, ...attributes] = segments;

  if (!nameValue) {
    return null;
  }

  const separatorIndex = nameValue.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex).trim();
  const value = nameValue.slice(separatorIndex + 1);

  if (!name) {
    return null;
  }

  const options: CookieOptions = {
    path: "/",
  };

  for (const attribute of attributes) {
    const [rawKey, rawValue] = attribute.split("=");
    const key = rawKey?.trim().toLowerCase();
    const attrValue = rawValue?.trim();

    if (!key) {
      continue;
    }

    if (key === "httponly") {
      options.httpOnly = true;
      continue;
    }

    if (key === "secure") {
      options.secure = true;
      continue;
    }

    if (key === "path" && attrValue) {
      options.path = attrValue;
      continue;
    }

    if (key === "domain" && attrValue) {
      options.domain = attrValue;
      continue;
    }

    if (key === "max-age" && attrValue) {
      const parsedMaxAge = Number.parseInt(attrValue, 10);
      if (!Number.isNaN(parsedMaxAge)) {
        options.maxAge = parsedMaxAge;
      }
      continue;
    }

    if (key === "expires" && attrValue) {
      const parsedDate = new Date(attrValue);
      if (!Number.isNaN(parsedDate.getTime())) {
        options.expires = parsedDate;
      }
      continue;
    }

    if (key === "samesite" && attrValue) {
      const normalized = attrValue.toLowerCase();
      if (normalized === "lax" || normalized === "strict" || normalized === "none") {
        options.sameSite = normalized;
      }
    }
  }

  return { name, value, options };
}

async function forwardSetCookies(response: Response): Promise<void> {
  const cookieStore = await cookies();
  const setCookieHeaders = getSetCookieHeaders(response);

  for (const header of setCookieHeaders) {
    const parsed = parseSetCookieHeader(header);
    if (!parsed) {
      continue;
    }

    cookieStore.set(parsed.name, parsed.value, parsed.options);
  }
}

async function postAuth(path: string, body?: unknown): Promise<AuthMutationResult> {
  const cookieStore = await cookies();
  const cookieHeader = toCookieHeader(cookieStore.getAll());

  try {
    const response = await fetch(`${getServerApiBaseUrl()}/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: "no-store",
      body: JSON.stringify(body ?? {}),
    });

    if (!response.ok) {
      const apiError = await getApiErrorMessage(response);
      return {
        success: false,
        error: apiError ?? getErrorMessage(response.status, "Auth request failed. Try again."),
      };
    }

    await forwardSetCookies(response);

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Auth service is unavailable. Check API server and proxy configuration.",
    };
  }
}

export async function sendOtpServer(email: string): Promise<AuthMutationResult> {
  return postAuth("/email-otp/send-verification-otp", {
    email,
    type: "sign-in",
  });
}

export async function verifyOtpServer(
  email: string,
  otp: string,
): Promise<AuthMutationResult> {
  return postAuth("/sign-in/email-otp", {
    email,
    otp,
  });
}

export async function signOutServer(): Promise<AuthMutationResult> {
  return postAuth("/sign-out");
}
