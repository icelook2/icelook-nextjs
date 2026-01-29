"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/lib/ui/button";

interface PromoSlideProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  onContinue: () => void;
}

/**
 * Full-height onboarding slide with gradient header and content below.
 * Gradient extends edge-to-edge at the top of the dialog.
 */
export function PromoSlide({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onContinue,
}: PromoSlideProps) {
  return (
    <div className="flex w-full shrink-0 flex-col">
      {/* Gradient header with icon - purple to match the promo card */}
      <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Content with padding */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 leading-relaxed text-muted">{description}</p>

        <div className="mt-6">
          <Button onClick={onContinue}>{buttonLabel}</Button>
        </div>
      </div>
    </div>
  );
}
