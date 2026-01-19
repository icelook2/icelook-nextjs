"use client";

import Link from "next/link";
import { IcelookLogo } from "@/components/icelook-logo";
import { cn } from "@/lib/utils/cn";

interface MobileHeaderProps {
  className?: string;
}

export function MobileHeader({ className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "pt-[env(safe-area-inset-top,0px)]",
        className,
      )}
    >
      <div className="flex h-14 items-center px-4">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Go to home"
        >
          <IcelookLogo size={28} />
          <span className="text-xl font-semibold tracking-tight">Icelook</span>
        </Link>
      </div>
    </header>
  );
}
