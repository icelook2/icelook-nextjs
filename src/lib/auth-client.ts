import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";

function resolveAuthBaseUrl() {
	const configured = process.env.NEXT_PUBLIC_AUTH_BASE_URL?.trim();

	if (configured) {
		return configured.replace(/\/$/, "");
	}

	return process.env.NODE_ENV === "production"
		? "https://api.icelook.app/auth"
		: "http://localhost:8787/auth";
}

export const authClient = createAuthClient({
	baseURL: resolveAuthBaseUrl(),
	fetchOptions: {
		credentials: "include",
	},
	plugins: [emailOTPClient()],
});
