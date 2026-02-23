import { cookies, headers } from "next/headers";
import type { SafeSession } from "./types";

function resolveAuthBaseUrl() {
	const configured = process.env.AUTH_BASE_URL?.trim() ?? process.env.NEXT_PUBLIC_AUTH_BASE_URL?.trim();

	if (configured) {
		return configured.replace(/\/$/, "");
	}

	return process.env.NODE_ENV === "production"
		? "https://api.icelook.app/auth"
		: "http://localhost:8787/auth";
}

export async function getServerSession(): Promise<SafeSession> {
	const cookieStore = await cookies();
	const incomingHeaders = await headers();
	const cookieHeader = cookieStore.toString();
	const authorizationHeader = incomingHeaders.get("authorization");
	const requestHeaders = new Headers();

	if (cookieHeader) {
		requestHeaders.set("cookie", cookieHeader);
	}

	if (authorizationHeader) {
		requestHeaders.set("authorization", authorizationHeader);
	}

	const response = await fetch(`${resolveAuthBaseUrl()}/get-session`, {
		method: "GET",
		headers: requestHeaders,
		cache: "no-store",
	});

	if (!response.ok) {
		return null;
	}

	const payload = (await response.json()) as Partial<SafeSession>;

	if (!payload || typeof payload !== "object") {
		return null;
	}

	const userId = payload.session?.userId;
	if (typeof userId !== "string" || userId.length === 0) {
		return null;
	}

	return {
		session: {
			userId,
		},
		user: payload.user,
	};
}
