"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
}

// Preset colors that work well for labels
const PRESET_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#1F2937", // Dark Gray
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* No color option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
          value === null
            ? "border-primary ring-2 ring-primary/30"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",
        )}
        title="No color"
      >
        {value === null && <Check className="h-4 w-4" />}
        {value !== null && <X className="h-3 w-3 text-muted" />}
      </button>

      {/* Preset colors */}
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
            value === color
              ? "border-primary ring-2 ring-primary/30"
              : "border-transparent hover:scale-110",
          )}
          style={{ backgroundColor: color }}
          title={color}
        >
          {value === color && (
            <Check
              className="h-4 w-4"
              style={{ color: getContrastColor(color) }}
            />
          )}
        </button>
      ))}

      {/* Custom color input */}
      <div className="relative">
        <input
          type="color"
          value={value ?? "#6B7280"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer appearance-none rounded-full border-2 border-gray-300 bg-transparent p-0 dark:border-gray-600"
          title="Custom color"
        />
      </div>
    </div>
  );
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = Number.parseInt(hex.substring(0, 2), 16);
  const g = Number.parseInt(hex.substring(2, 4), 16);
  const b = Number.parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
