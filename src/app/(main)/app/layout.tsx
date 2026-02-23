import { redirect } from "next/navigation";
import { getServerSession } from "@/features/auth/session";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const session = await getServerSession();

	if (!session) {
		redirect(`/auth/sign-in?next=${encodeURIComponent("/app")}`);
	}

	return <>{children}</>;
}
