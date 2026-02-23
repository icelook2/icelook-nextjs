import { SignOutButton } from "@/features/auth/components/sign-out-button";

export default function AppPage() {
	return (
		<main className="min-h-screen bg-slate-100 px-6 py-12">
			<div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
				<h1 className="text-2xl font-semibold text-slate-900">App</h1>
				<p className="mt-2 text-sm text-slate-600">You are signed in.</p>
				<div className="mt-6">
					<SignOutButton />
				</div>
			</div>
		</main>
	);
}
