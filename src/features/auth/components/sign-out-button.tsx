"use client";

import { Button } from "@base-ui/react/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
	const router = useRouter();
	const [isPending, setIsPending] = useState(false);

	const onSignOut = async () => {
		setIsPending(true);
		try {
			await authClient.signOut();
			router.replace("/auth/sign-in");
			router.refresh();
		} finally {
			setIsPending(false);
		}
	};

	return (
		<Button
			type="button"
			onClick={onSignOut}
			disabled={isPending}
			className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
		>
			{isPending ? "Signing out..." : "Sign out"}
		</Button>
	);
}
