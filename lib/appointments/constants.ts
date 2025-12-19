/**
 * Appointment system constants.
 */

import type { AppointmentStatus } from "./types";

/**
 * Status colors for badges (supports dark mode).
 */
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending:
    "text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40",
  confirmed:
    "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40",
  completed:
    "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40",
  cancelled:
    "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/40",
  no_show: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40",
} as const;

/**
 * Status icons (Lucide icon names).
 */
export const STATUS_ICONS: Record<AppointmentStatus, string> = {
  pending: "Clock",
  confirmed: "CheckCircle",
  completed: "Check",
  cancelled: "X",
  no_show: "UserX",
} as const;

/**
 * Default booking settings for new specialists.
 */
export const DEFAULT_BOOKING_SETTINGS = {
  auto_confirm: false,
  min_booking_notice_hours: 2,
  max_booking_days_ahead: 30,
  allow_client_cancellation: true,
  cancellation_notice_hours: 24,
} as const;

/**
 * Allowed status transitions.
 * Maps current status to allowed next statuses.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  no_show: [], // Terminal state
} as const;
