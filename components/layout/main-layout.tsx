import type { ReactNode } from "react";
import type { Profile } from "@/lib/auth/session";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

interface MainLayoutProps {
	children: ReactNode;
	beautyPagesCount?: number;
	profile: Profile | null;
}

export function MainLayout({
	children,
	beautyPagesCount = 0,
	profile,
}: MainLayoutProps) {
	return (
		<div className="min-h-screen bg-background">
			{/* Sidebar - hidden on mobile, visible on md+ */}
			<Sidebar
				className="hidden md:flex"
				beautyPagesCount={beautyPagesCount}
				profile={profile}
			/>

			{/* Main content area */}
			<main className="min-h-screen pb-20 md:pb-8 md:pl-[72px]">
				{children}
			</main>

			{/* Bottom nav - visible on mobile, hidden on md+ */}
			<BottomNav
				className="md:hidden"
				beautyPagesCount={beautyPagesCount}
				profile={profile}
			/>
		</div>
	);
}
