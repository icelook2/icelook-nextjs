import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type BusinessHours =
  Database["public"]["Tables"]["beauty_page_business_hours"]["Row"];
export type SpecialHours =
  Database["public"]["Tables"]["beauty_page_special_hours"]["Row"];

export type EffectiveHours = {
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  isSpecialDay: boolean;
  specialDayName?: string | null;
};

// Days of week constants matching JS Date.getDay()
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

/**
 * Default business hours if none are set
 */
export function getDefaultBusinessHours(): Array<{
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}> {
  return [
    { dayOfWeek: 0, isOpen: false, openTime: "09:00", closeTime: "18:00" }, // Sunday
    { dayOfWeek: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" }, // Monday
    { dayOfWeek: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" }, // Tuesday
    { dayOfWeek: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" }, // Wednesday
    { dayOfWeek: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" }, // Thursday
    { dayOfWeek: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" }, // Friday
    { dayOfWeek: 6, isOpen: true, openTime: "10:00", closeTime: "16:00" }, // Saturday
  ];
}

/**
 * Fetches all regular business hours for a beauty page
 */
export async function getBusinessHours(
  beautyPageId: string,
): Promise<BusinessHours[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_business_hours")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("Error fetching business hours:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Fetches business hours for a specific day of week
 */
export async function getBusinessHoursForDay(
  beautyPageId: string,
  dayOfWeek: number,
): Promise<BusinessHours | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_business_hours")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (error) {
    // PGRST116 = no rows found, which is expected if not configured
    if (error.code !== "PGRST116") {
      console.error("Error fetching business hours for day:", error);
    }
    return null;
  }

  return data;
}

/**
 * Fetches all special hours (holidays/exceptions) for a beauty page
 * Orders by date ascending
 */
export async function getSpecialHours(
  beautyPageId: string,
): Promise<SpecialHours[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_special_hours")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching special hours:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Fetches special hours for a specific date
 */
export async function getSpecialHoursForDate(
  beautyPageId: string,
  date: string,
): Promise<SpecialHours | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("beauty_page_special_hours")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .eq("date", date)
    .single();

  if (error) {
    // PGRST116 = no rows found, which is expected for most dates
    if (error.code !== "PGRST116") {
      console.error("Error fetching special hours for date:", error);
    }
    return null;
  }

  return data;
}

/**
 * Gets the effective hours for a specific date
 * Priority: special_hours > regular business_hours > defaults
 *
 * @param beautyPageId - The beauty page ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns Effective hours for that date
 */
export async function getEffectiveHoursForDate(
  beautyPageId: string,
  date: string,
): Promise<EffectiveHours> {
  // First check for special hours (holidays/exceptions)
  const specialHours = await getSpecialHoursForDate(beautyPageId, date);

  if (specialHours) {
    return {
      isOpen: specialHours.is_open,
      openTime: specialHours.open_time,
      closeTime: specialHours.close_time,
      isSpecialDay: true,
      specialDayName: specialHours.name,
    };
  }

  // Fall back to regular business hours for that day of week
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();

  const businessHours = await getBusinessHoursForDay(beautyPageId, dayOfWeek);

  if (businessHours) {
    return {
      isOpen: businessHours.is_open,
      openTime: businessHours.open_time,
      closeTime: businessHours.close_time,
      isSpecialDay: false,
    };
  }

  // Fall back to defaults if no hours configured
  const defaults = getDefaultBusinessHours();
  const defaultDay = defaults.find((d) => d.dayOfWeek === dayOfWeek);

  return {
    isOpen: defaultDay?.isOpen ?? false,
    openTime: defaultDay?.openTime ?? null,
    closeTime: defaultDay?.closeTime ?? null,
    isSpecialDay: false,
  };
}

/**
 * Normalizes time string to HH:MM format
 * Handles both HH:MM and HH:MM:SS formats
 */
export function normalizeTime(time: string | null): string | null {
  if (!time) {
    return null;
  }
  // Take only HH:MM part
  return time.slice(0, 5);
}
