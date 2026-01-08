import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StarRatingProps {
  /** Rating value from 0-5 */
  rating: number;
  /** Size of the stars */
  size?: "sm" | "md" | "lg";
  /** Whether to show the numeric rating value */
  showValue?: boolean;
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/**
 * Displays a star rating with filled, half-filled, and empty stars.
 * Supports fractional ratings (e.g., 4.5 shows 4 full stars and 1 half star).
 */
export function StarRating({
  rating,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const clampedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(sizeClasses[size], "fill-amber-400 text-amber-400")}
        />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className={cn(sizeClasses[size], "text-muted")} />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: "50%" }}
          >
            <Star
              className={cn(sizeClasses[size], "fill-amber-400 text-amber-400")}
            />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(sizeClasses[size], "text-muted")}
        />
      ))}

      {/* Numeric value */}
      {showValue && rating > 0 && (
        <span className={cn("ml-1 font-medium", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface CompactRatingProps {
  /** Rating value from 0-5 */
  rating: number;
  /** Total number of reviews */
  reviewCount: number;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

/**
 * Compact rating display showing a single star with rating and count.
 * Example: ★ 4.8 (123)
 */
export function CompactRating({
  rating,
  reviewCount,
  size = "md",
  className,
}: CompactRatingProps) {
  if (reviewCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <Star
        className={cn(
          "fill-amber-400 text-amber-400",
          size === "sm" ? "size-3" : "size-4",
        )}
      />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-muted">({reviewCount})</span>
    </div>
  );
}
