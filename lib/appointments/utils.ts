/**
 * Appointment utility functions.
 */

import { format, parseISO } from "date-fns";
import type { BookingService, BookingTotals, Currency } from "./types";

/**
 * Format time from "HH:MM:SS" or "HH:MM" to "HH:MM" for display.
 */
export function formatTimeForDisplay(time: string): string {
  return time.slice(0, 5); // "10:00:00" → "10:00" or "10:00" → "10:00"
}

/**
 * Format time from "HH:MM" to "HH:MM:SS" for database.
 */
export function formatTimeForDatabase(time: string): string {
  if (time.length === 5) {
    return `${time}:00`;
  }
  return time;
}

/**
 * Calculate end time given start time and duration.
 * @param startTime - Start time in "HH:MM" format
 * @param durationMinutes - Duration in minutes
 * @returns End time in "HH:MM" format
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

/**
 * Format date for display.
 * @param dateString - Date in "YYYY-MM-DD" format
 * @returns Formatted date string (e.g., "January 15, 2025")
 */
export function formatDateForDisplay(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, "MMMM d, yyyy");
}

/**
 * Format date and time for display.
 * @param dateString - Date in "YYYY-MM-DD" format
 * @param timeString - Time in "HH:MM" or "HH:MM:SS" format
 * @returns Formatted string (e.g., "January 15, 2025 at 10:00")
 */
export function formatDateTimeForDisplay(
  dateString: string,
  timeString: string,
): string {
  const formattedDate = formatDateForDisplay(dateString);
  const formattedTime = formatTimeForDisplay(timeString);
  return `${formattedDate} at ${formattedTime}`;
}

/**
 * Check if appointment can be cancelled based on cancellation policy.
 * @param date - Appointment date in "YYYY-MM-DD" format
 * @param startTime - Appointment start time in "HH:MM:SS" format
 * @param cancellationNoticeHours - Minimum hours before appointment for cancellation
 * @returns Whether cancellation is allowed
 */
export function canCancelAppointment(
  date: string,
  startTime: string,
  cancellationNoticeHours: number,
): boolean {
  const appointmentDateTime = new Date(`${date}T${startTime}`);
  const now = new Date();
  const hoursUntilAppointment =
    (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilAppointment >= cancellationNoticeHours;
}

/**
 * Check if a date is within the booking window.
 * @param date - Date to check in "YYYY-MM-DD" format
 * @param minNoticeHours - Minimum hours before booking allowed
 * @param maxDaysAhead - Maximum days in advance booking allowed
 * @returns Whether the date is bookable
 */
export function isDateBookable(
  date: string,
  minNoticeHours: number,
  maxDaysAhead: number,
): boolean {
  const targetDate = parseISO(date);
  const now = new Date();

  // Check minimum notice (date must be at least minNoticeHours from now)
  const minDate = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);
  if (targetDate < minDate) {
    return false;
  }

  // Check maximum days ahead
  const maxDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);
  if (targetDate > maxDate) {
    return false;
  }

  return true;
}

/**
 * Format price with currency symbol.
 */
export function formatPrice(
  price: number,
  currency: "UAH" | "USD" | "EUR",
): string {
  const symbols: Record<string, string> = {
    UAH: "₴",
    USD: "$",
    EUR: "€",
  };
  return `${symbols[currency]}${price.toLocaleString()}`;
}

/**
 * Format duration for display.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Calculate totals for multiple services.
 * @param services - Array of services to calculate totals for
 * @returns Computed totals including price, duration, and currency
 * @throws Error if services array is empty or currencies don't match
 */
export function calculateBookingTotals(services: BookingService[]): BookingTotals {
  if (services.length === 0) {
    throw new Error("At least one service is required");
  }

  const currency = services[0].currency;

  // Validate all services have the same currency
  const hasMixedCurrencies = services.some((s) => s.currency !== currency);
  if (hasMixedCurrencies) {
    throw new Error("All services must have the same currency");
  }

  return {
    totalPrice: services.reduce((sum, s) => sum + s.price, 0),
    totalDurationMinutes: services.reduce((sum, s) => sum + s.duration_minutes, 0),
    currency: currency as Currency,
  };
}
