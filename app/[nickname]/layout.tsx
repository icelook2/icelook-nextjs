import type { ReactNode } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { getProfile } from "@/lib/auth/session";
import { getUserBeautyPages } from "@/lib/queries";

interface BeautyPageLayoutProps {
	children: ReactNode;
}

export default async function BeautyPageLayout({
	children,
}: BeautyPageLayoutProps) {
	// Get profile and beauty pages if user is authenticated
	// This allows the nav to show the correct items for logged-in users
	const profile = await getProfile();
	let beautyPagesCount = 0;

	if (profile) {
		const beautyPages = await getUserBeautyPages(profile.id);
		beautyPagesCount = beautyPages.length;
	}

	return (
		<MainLayout beautyPagesCount={beautyPagesCount} profile={profile}>
			{children}
		</MainLayout>
	);
}
