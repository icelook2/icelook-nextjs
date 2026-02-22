import { getBrowserApiAuthBaseUrl } from "./config";

type BrowserAuthResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

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
    if (
      typeof typedPayload.message === "string" &&
      typedPayload.message.length > 0
    ) {
      return typedPayload.message;
    }
  } catch {
    return null;
  }

  return null;
}

async function request(
  path: string,
  body?: unknown,
): Promise<BrowserAuthResult<{ status?: number }>> {
  const url = `${getBrowserApiAuthBaseUrl()}${path}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: body ? JSON.stringify(body) : "{}",
    });

    if (!response.ok) {
      const apiError = await getApiErrorMessage(response);
      return {
        success: false,
        error:
          apiError ??
          getErrorMessage(response.status, "Auth request failed. Try again."),
      };
    }

    return {
      success: true,
      data: { status: response.status },
    };
  } catch {
    return {
      success: false,
      error:
        "Auth service is unavailable. Check API server and proxy configuration.",
    };
  }
}

export async function sendOtp(email: string): Promise<BrowserAuthResult> {
  const response = await request("/email-otp/send-verification-otp", {
    email,
    type: "sign-in",
  });

  return response.success ? { success: true } : response;
}

export async function resendOtp(email: string): Promise<BrowserAuthResult> {
  return sendOtp(email);
}

export async function verifyOtp(
  email: string,
  otp: string,
): Promise<BrowserAuthResult> {
  const response = await request("/sign-in/email-otp", {
    email,
    otp,
  });

  return response.success ? { success: true } : response;
}

export async function signOut(): Promise<BrowserAuthResult> {
  const response = await request("/sign-out");

  return response.success ? { success: true } : response;
}
