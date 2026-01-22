"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface InteractiveStarRatingProps {
  /** Current rating value (1-5 or 0 for unset) */
  value: number;
  /** Callback when rating changes */
  onChange: (rating: number) => void;
  /** Size of the stars */
  size?: "sm" | "md" | "lg";
  /** Whether the rating is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
};

const gapClasses = {
  sm: "gap-1",
  md: "gap-1.5",
  lg: "gap-2",
};

/**
 * Interactive star rating component for selecting ratings.
 * Supports click/tap selection, hover preview, and keyboard navigation.
 */
export function InteractiveStarRating({
  value,
  onChange,
  size = "md",
  disabled = false,
  className,
}: InteractiveStarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  // Display the hover rating when hovering, otherwise the actual value
  const displayRating = hoverRating > 0 ? hoverRating : value;

  function handleKeyDown(event: React.KeyboardEvent, starIndex: number) {
    if (disabled) {
      return;
    }

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        onChange(starIndex);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (starIndex < 5) {
          const nextStar = document.querySelector(
            `[data-star-index="${starIndex + 1}"]`,
          ) as HTMLButtonElement | null;
          nextStar?.focus();
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (starIndex > 1) {
          const prevStar = document.querySelector(
            `[data-star-index="${starIndex - 1}"]`,
          ) as HTMLButtonElement | null;
          prevStar?.focus();
        }
        break;
    }
  }

  return (
    <div
      className={cn("flex items-center", gapClasses[size], className)}
      role="group"
      aria-label="Rating"
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= displayRating;

        return (
          <button
            key={starIndex}
            type="button"
            data-star-index={starIndex}
            disabled={disabled}
            onClick={() => onChange(starIndex)}
            onMouseEnter={() => !disabled && setHoverRating(starIndex)}
            onKeyDown={(e) => handleKeyDown(e, starIndex)}
            className={cn(
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded transition-transform",
              !disabled && "hover:scale-110 cursor-pointer",
              disabled && "cursor-not-allowed opacity-50",
            )}
            aria-label={`Rate ${starIndex} star${starIndex !== 1 ? "s" : ""}`}
            aria-pressed={value === starIndex}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted hover:text-amber-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
