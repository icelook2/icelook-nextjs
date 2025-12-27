import { cn } from "@/lib/utils/cn";

interface LabelBadgeProps {
  name: string;
  color: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * A badge component for displaying specialist labels.
 * If a color is provided, it's used as the background with appropriate text contrast.
 * If no color, falls back to a default muted style.
 */
export function LabelBadge({
  name,
  color,
  size = "md",
  className,
}: LabelBadgeProps) {
  // Calculate whether text should be light or dark based on background color
  const textColor = color ? getContrastTextColor(color) : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        !color && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        className,
      )}
      style={
        color
          ? {
              backgroundColor: color,
              color: textColor,
            }
          : undefined
      }
    >
      {name}
    </span>
  );
}

/**
 * Calculate whether to use light or dark text based on background color.
 * Uses relative luminance formula for accessibility.
 */
function getContrastTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Parse RGB values
  const r = Number.parseInt(hex.substring(0, 2), 16);
  const g = Number.parseInt(hex.substring(2, 4), 16);
  const b = Number.parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance using sRGB formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use white text for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
