/**
 * Discount Badge Component
 *
 * Displays a discount percentage in a styled badge.
 * Used for bundles and promotions throughout the app.
 */

import { cn } from "@/lib/utils/cn";

// ============================================================================
// Types
// ============================================================================

interface DiscountBadgeProps {
  /** Discount percentage (e.g., 10 for 10%) */
  percentage: number;
  /** Color variant */
  variant?: "violet" | "emerald";
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Displays a discount percentage badge.
 *
 * @example
 * <DiscountBadge percentage={10} /> // Displays "-10%"
 * <DiscountBadge percentage={20} variant="emerald" />
 */
export function DiscountBadge({
  percentage,
  variant = "violet",
  className,
}: DiscountBadgeProps) {
  if (percentage <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-semibold",
        variant === "violet" &&
          "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
        variant === "emerald" &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
        className,
      )}
    >
      -{percentage}%
    </span>
  );
}
