import { redirect } from "next/navigation";
import { SignInView } from "@/features/auth/components/sign-in-view";
import { normalizeNextPath } from "@/features/auth/next-path";
import { getServerSession } from "@/features/auth/session";

type SignInPageProps = {
	searchParams: Promise<{
		next?: string | string[];
	}>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
	const params = await searchParams;
	const nextInput = Array.isArray(params.next) ? params.next[0] : params.next;
	const nextPath = normalizeNextPath(nextInput);
	const session = await getServerSession();

	if (session) {
		redirect(nextPath);
	}

	return <SignInView nextPath={nextPath} />;
}
