"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SplitLayoutProps {
  /** Form content for the left panel */
  form: ReactNode;
  /** Preview content for the right panel */
  preview: ReactNode;
  /** Title shown above the form */
  title: string;
  /** Subtitle/description shown below the title */
  subtitle?: string;
  /** Optional additional class names */
  className?: string;
}

/**
 * Split layout for the create beauty page flow.
 *
 * Desktop (lg+): Form on left (60%), Preview on right (40%)
 * Mobile: Form on top, Preview below (optional collapsed state)
 *
 * The preview panel uses a sticky position on desktop so it stays
 * visible while the user scrolls through the form.
 */
export function SplitLayout({
  form,
  preview,
  title,
  subtitle,
  className,
}: SplitLayoutProps) {
  return (
    <div className={cn("flex flex-1 flex-col lg:flex-row lg:gap-8", className)}>
      {/* Form Panel - Left on desktop, top on mobile */}
      <div className="flex flex-1 flex-col lg:max-w-[55%]">
        {/* Header */}
        <div className="mb-6 text-center lg:text-left">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>

        {/* Form content */}
        <div className="flex-1">{form}</div>
      </div>

      {/* Preview Panel - Right on desktop, bottom on mobile */}
      <div className="mt-8 lg:mt-0 lg:w-[45%]">
        <div className="lg:sticky lg:top-6">
          {/* Preview card with subtle background */}
          <div className="rounded-2xl border border-border bg-surface-secondary p-4 lg:p-6">
            <div className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted">
              Preview
            </div>
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}
