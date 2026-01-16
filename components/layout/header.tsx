"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { IcelookLogo } from "@/components/icelook-logo";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "pointer-events-none sticky top-0 bg-gradient-to-b from-background from-40% to-transparent pt-3",
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-between">
          {/* Logo on the left */}
          <Link
            href="/"
            className="transition-opacity hover:opacity-80"
            aria-label="Go to home"
          >
            <IcelookLogo size={24} />
          </Link>

          {/* Hamburger menu on the right */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
