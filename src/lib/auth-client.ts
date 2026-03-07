import { createAuthClient } from "better-auth/svelte";
import { emailOTPClient } from "better-auth/client/plugins";
import { env } from "$env/dynamic/public";

export const authClient = createAuthClient({
	baseURL: env.PUBLIC_API_URL || undefined,
	plugins: [emailOTPClient()],
});
