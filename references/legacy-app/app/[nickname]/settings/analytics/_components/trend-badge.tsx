"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TrendBadgeProps {
  value: number;
  invertColor?: boolean;
}

export function TrendBadge({ value, invertColor = false }: TrendBadgeProps) {
  const isPositive = value >= 0;
  // For inverted metrics (like cancellation rate), going UP is bad, going DOWN is good
  const isGreen = invertColor ? !isPositive : isPositive;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        isGreen ? "text-success" : "text-danger",
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full",
          isGreen ? "bg-success/15" : "bg-danger/15",
        )}
      >
        {isPositive ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )}
      </span>
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}
