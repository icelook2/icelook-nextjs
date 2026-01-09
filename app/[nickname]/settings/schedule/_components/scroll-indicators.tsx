"use client";

import { cn } from "@/lib/utils/cn";

interface ScrollIndicatorsProps {
  /** Current visible item index (0-based) */
  currentIndex: number;
  /** Total number of items */
  totalCount: number;
  /** Whether there is content to scroll left */
  canScrollLeft: boolean;
  /** Whether there is content to scroll right */
  canScrollRight: boolean;
  /** Callback to scroll to a specific index */
  onScrollToIndex: (index: number) => void;
  className?: string;
}

/**
 * Visual indicators for horizontal scroll position
 * Shows dot pagination and current position
 */
export function ScrollIndicators({
  currentIndex,
  totalCount,
  canScrollLeft,
  canScrollRight,
  onScrollToIndex,
  className,
}: ScrollIndicatorsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 py-3 bg-background border-t border-border",
        className,
      )}
    >
      {/* Left arrow indicator */}
      <button
        type="button"
        onClick={() => onScrollToIndex(currentIndex - 1)}
        disabled={!canScrollLeft}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          canScrollLeft
            ? "text-muted hover:bg-surface-alt hover:text-foreground"
            : "text-border cursor-not-allowed",
        )}
        aria-label="Scroll left"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onScrollToIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === currentIndex
                ? "w-4 bg-accent"
                : "w-1.5 bg-border hover:bg-muted",
            )}
            aria-label={`Go to day ${i + 1}`}
            aria-current={i === currentIndex ? "true" : undefined}
          />
        ))}
      </div>

      {/* Right arrow indicator */}
      <button
        type="button"
        onClick={() => onScrollToIndex(currentIndex + 1)}
        disabled={!canScrollRight}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          canScrollRight
            ? "text-muted hover:bg-surface-alt hover:text-foreground"
            : "text-border cursor-not-allowed",
        )}
        aria-label="Scroll right"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
