"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  children: ReactNode;
}

export function EmptyState({ icon: Icon, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
        <Icon className="h-8 w-8 text-foreground/30" />
      </div>
      <p className="text-foreground/60">{children}</p>
    </div>
  );
}
