import type { AuthUiError } from "./types";

type ErrorLike = {
	message?: string;
	code?: string;
	status?: number;
	statusText?: string;
};

function toErrorLike(error: unknown): ErrorLike {
	if (!error || typeof error !== "object") {
		return {};
	}

	const value = error as Record<string, unknown>;
	const nested = (value.error && typeof value.error === "object" ? value.error : value) as Record<
		string,
		unknown
	>;

	return {
		message: typeof nested.message === "string" ? nested.message : undefined,
		code: typeof nested.code === "string" ? nested.code : undefined,
		status: typeof nested.status === "number" ? nested.status : undefined,
		statusText: typeof nested.statusText === "string" ? nested.statusText : undefined,
	};
}

export function toAuthUiError(error: unknown, fallbackField?: "email" | "otp"): AuthUiError {
	const normalized = toErrorLike(error);
	const haystack = `${normalized.code ?? ""} ${normalized.message ?? ""} ${normalized.statusText ?? ""}`.toLowerCase();

	if (normalized.status === 0 || haystack.includes("network") || haystack.includes("failed to fetch")) {
		return {
			code: "NETWORK",
			message: "Network error. Check your connection and try again.",
			field: fallbackField,
		};
	}

	if (normalized.status === 429 || haystack.includes("too many") || haystack.includes("rate") || haystack.includes("throttle")) {
		return {
			code: "THROTTLED",
			message: "Too many attempts. Please wait and try again.",
			field: fallbackField,
		};
	}

	if (haystack.includes("invalid") || haystack.includes("incorrect") || haystack.includes("mismatch")) {
		return {
			code: "INVALID_OTP",
			message: "The code is invalid or expired. Request a new code and try again.",
			field: fallbackField,
		};
	}

	if (haystack.includes("expired") || haystack.includes("timeout")) {
		return {
			code: "EXPIRED_OTP",
			message: "The code is invalid or expired. Request a new code and try again.",
			field: fallbackField,
		};
	}

	if (normalized.status === 400 || normalized.status === 422 || haystack.includes("validation")) {
		return {
			code: "VALIDATION",
			message: "Please check the entered values and try again.",
			field: fallbackField,
		};
	}

	return {
		code: "UNKNOWN",
		message: "Sign-in failed. Please try again.",
		field: fallbackField,
	};
}
