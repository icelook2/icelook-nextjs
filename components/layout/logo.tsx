"use client";

import Link from "next/link";
import { IcelookLogo } from "@/components/icelook-logo";
import { cn } from "@/lib/utils/cn";
import { useActiveBeautyPage } from "./active-beauty-page-context";

interface LogoProps {
  className?: string;
}

/**
 * Logo component that links to the appropriate home page based on user role:
 * - Creator: Links to their active beauty page profile (/{nickname})
 * - Client: Links to /appointments
 */
export function Logo({ className }: LogoProps) {
  const { role, activeBeautyPage } = useActiveBeautyPage();

  // Determine home route based on role
  const homeHref =
    role === "creator" && activeBeautyPage
      ? `/${activeBeautyPage.slug}`
      : "/appointments";

  return (
    <Link
      href={homeHref}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl transition-all hover:scale-105",
        className,
      )}
      aria-label="Go to home"
    >
      <IcelookLogo size={36} />
    </Link>
  );
}
