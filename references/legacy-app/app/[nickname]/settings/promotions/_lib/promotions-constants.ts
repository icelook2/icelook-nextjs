import type { PromotionStatus, PromotionType } from "@/lib/queries/promotions";

// Time options for select (every 30 minutes from 06:00 to 22:00)
export const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30; // Start at 06:00
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return { value, label: value };
});

// Duration options
export const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h 30m" },
  { value: 120, label: "2h" },
  { value: 150, label: "2h 30m" },
  { value: 180, label: "3h" },
];

// Discount preset options
export const DISCOUNT_OPTIONS = [
  { value: 5, label: "5%" },
  { value: 10, label: "10%" },
  { value: 15, label: "15%" },
  { value: 20, label: "20%" },
  { value: 25, label: "25%" },
  { value: 30, label: "30%" },
];

// Days of week options
export const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

// Status badge color classes
export const STATUS_COLORS: Record<PromotionStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  booked: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

// Type badge color classes
export const TYPE_COLORS: Record<PromotionType, string> = {
  sale: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  slot: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  time: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
};

export interface PromotionItem {
  id: string;
  type: PromotionType;
  discountPercentage: number;
  originalPriceCents: number;
  discountedPriceCents: number;
  status: PromotionStatus;
  // Sale fields
  startsAt: string | null;
  endsAt: string | null;
  // Slot fields
  slotDate: string | null;
  slotStartTime: string | null;
  slotEndTime: string | null;
  // Time fields
  recurringStartTime: string | null;
  recurringDays: number[] | null;
  recurringValidUntil: string | null;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
}

export interface FlattenedService {
  id: string;
  name: string;
  groupName: string;
  priceCents: number;
  durationMinutes: number;
}
