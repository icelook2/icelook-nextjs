import type { CreateBeautyPageStep } from "./types";

/**
 * Duration options for service creation
 * Value is string for Select component, represents minutes
 */
export const DURATION_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
] as const;

/**
 * Default service values
 */
export const DEFAULT_DURATION = 60; // 1 hour
export const DEFAULT_PRICE = 500; // 500 UAH (stored as display value, converted to cents before sending)

/**
 * Default working hours if user doesn't choose a preset
 */
export const DEFAULT_START_TIME = "09:00";
export const DEFAULT_END_TIME = "18:00";

/**
 * Step order for navigation (7-step wizard)
 *
 * Required steps: name, nickname, confirmation
 * Optional steps: avatar, contacts, services, first-working-day
 */
export const STEP_ORDER: CreateBeautyPageStep[] = [
  "name",
  "nickname",
  "avatar",
  "contacts",
  "services",
  "first-working-day",
  "confirmation",
];

/**
 * Steps that can be skipped (optional steps)
 */
export const SKIPPABLE_STEPS: CreateBeautyPageStep[] = [
  "avatar",
  "contacts",
  "services",
  "first-working-day",
];

/**
 * Total number of visible steps in the flow
 * Used for progress indicator
 */
export const TOTAL_STEPS = 7;

/**
 * Time options for working hours selection
 * 30-minute intervals from 06:00 to 23:30
 */
export const TIME_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const hours = Math.floor(i / 2) + 6;
  const minutes = (i % 2) * 30;
  const value = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  return { value, label: value };
});

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format price from cents to display value
 */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(0);
}
