"use client";

import { BadgeCheck, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Popover } from "@/lib/ui/popover";

interface VerifiedBadgeProps {
  translations: {
    title: string;
    description: string;
  };
}

/**
 * Verified badge with popover explanation.
 *
 * Displayed next to beauty page names that have been officially
 * verified by Icelook. Shows a checkmark badge that reveals
 * verification details on click/hover.
 *
 * Uses client-only rendering to avoid Base UI hydration mismatches on Safari.
 */
export function VerifiedBadge({ translations }: VerifiedBadgeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render static badge on server, interactive popover after hydration
  if (!mounted) {
    return (
      <span className="inline-flex items-center text-accent">
        <BadgeCheck className="h-5 w-5" aria-label="Verified" />
      </span>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger className="inline-flex cursor-pointer items-center text-accent transition-colors hover:text-accent/80">
        <BadgeCheck className="h-5 w-5" aria-label="Verified" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="w-72 p-4"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <ShieldCheck className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground">
                {translations.title}
              </h4>
              <p className="mt-1 text-sm text-muted">
                {translations.description}
              </p>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
