export function normalizeNextPath(value: string | null | undefined): string {
	if (!value) {
		return "/";
	}

	let decoded = value;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		decoded = value;
	}

	if (!decoded.startsWith("/") || decoded.startsWith("//")) {
		return "/";
	}

	if (decoded.startsWith("/auth/sign-in")) {
		return "/";
	}

	return decoded;
}
