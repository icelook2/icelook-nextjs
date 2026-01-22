import { createClient } from "@/lib/supabase/server";

// Promotion type enum (matches database)
export type PromotionType = "sale" | "slot" | "time";

// Promotion status enum (matches database)
export type PromotionStatus = "active" | "booked" | "expired" | "inactive";

// Raw promotion row from database
export type PromotionRow = {
  id: string;
  beauty_page_id: string;
  service_id: string;
  type: PromotionType;
  discount_percentage: number;
  // For type='sale'
  starts_at: string | null;
  ends_at: string | null;
  // For type='slot'
  slot_date: string | null;
  slot_start_time: string | null;
  slot_end_time: string | null;
  // For type='time'
  recurring_start_time: string | null;
  recurring_days: number[] | null;
  recurring_valid_until: string | null;
  // Computed prices
  original_price_cents: number;
  discounted_price_cents: number;
  status: PromotionStatus;
  created_at: string;
  updated_at: string;
};

// Promotion with joined service data
export type PromotionWithService = PromotionRow & {
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    service_group_id: string;
  };
};

// Public promotion for display on beauty pages (camelCase)
export type PublicPromotion = {
  id: string;
  type: PromotionType;
  discountPercentage: number;
  originalPriceCents: number;
  discountedPriceCents: number;
  // For type='sale'
  startsAt: string | null;
  endsAt: string | null;
  // For type='slot'
  slotDate: string | null;
  slotStartTime: string | null;
  slotEndTime: string | null;
  // For type='time'
  recurringStartTime: string | null;
  recurringDays: number[] | null;
  recurringValidUntil: string | null;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
};

/**
 * Fetches active promotions for public display on a beauty page
 * Includes: active sales (ends_at >= today), active slots (slot_date >= today), active time promotions
 */
export async function getActivePromotions(
  beautyPageId: string,
): Promise<PublicPromotion[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      id,
      type,
      discount_percentage,
      starts_at,
      ends_at,
      slot_date,
      slot_start_time,
      slot_end_time,
      recurring_start_time,
      recurring_days,
      recurring_valid_until,
      original_price_cents,
      discounted_price_cents,
      service:services (
        id,
        name,
        duration_minutes
      )
    `,
    )
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching promotions:", error.message);
    return [];
  }

  // Filter by date relevance and transform to camelCase
  type ServiceData = { id: string; name: string; duration_minutes: number };

  return (data ?? [])
    .filter((promo) => {
      // Filter out expired promotions
      if (promo.type === "sale" && promo.ends_at && promo.ends_at < today) {
        return false;
      }
      if (promo.type === "slot" && promo.slot_date && promo.slot_date < today) {
        return false;
      }
      if (
        promo.type === "time" &&
        promo.recurring_valid_until &&
        promo.recurring_valid_until < today
      ) {
        return false;
      }
      return true;
    })
    .map((promo) => {
      const service = promo.service as unknown as ServiceData;
      return {
        id: promo.id,
        type: promo.type as PromotionType,
        discountPercentage: promo.discount_percentage,
        originalPriceCents: promo.original_price_cents,
        discountedPriceCents: promo.discounted_price_cents,
        startsAt: promo.starts_at,
        endsAt: promo.ends_at,
        slotDate: promo.slot_date,
        slotStartTime: promo.slot_start_time,
        slotEndTime: promo.slot_end_time,
        recurringStartTime: promo.recurring_start_time,
        recurringDays: promo.recurring_days,
        recurringValidUntil: promo.recurring_valid_until,
        service: {
          id: service.id,
          name: service.name,
          durationMinutes: service.duration_minutes,
        },
      };
    });
}

/**
 * Fetches all promotions for a beauty page (for creator settings)
 * Includes all statuses
 */
export async function getAllPromotions(
  beautyPageId: string,
): Promise<PromotionWithService[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      *,
      service:services (
        id,
        name,
        duration_minutes,
        service_group_id
      )
    `,
    )
    .eq("beauty_page_id", beautyPageId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all promotions:", error.message);
    return [];
  }

  return (data ?? []) as PromotionWithService[];
}

/**
 * Fetches promotions for a specific service
 */
export async function getPromotionsForService(
  serviceId: string,
): Promise<PromotionWithService[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      *,
      service:services (
        id,
        name,
        duration_minutes,
        service_group_id
      )
    `,
    )
    .eq("service_id", serviceId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching promotions for service:", error.message);
    return [];
  }

  return (data ?? []) as PromotionWithService[];
}

/**
 * Fetches a single promotion by ID
 */
export async function getPromotionById(
  promotionId: string,
): Promise<PromotionWithService | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      *,
      service:services (
        id,
        name,
        duration_minutes,
        service_group_id
      )
    `,
    )
    .eq("id", promotionId)
    .single();

  if (error) {
    console.error("Error fetching promotion:", error.message);
    return null;
  }

  return data as PromotionWithService;
}

/**
 * Checks if a slot promotion exists for a specific service/date/time combination
 */
export async function checkSlotPromotionExists(
  beautyPageId: string,
  serviceId: string,
  slotDate: string,
  slotStartTime: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("promotions")
    .select("*", { count: "exact", head: true })
    .eq("beauty_page_id", beautyPageId)
    .eq("service_id", serviceId)
    .eq("type", "slot")
    .eq("slot_date", slotDate)
    .eq("slot_start_time", slotStartTime)
    .eq("status", "active");

  if (error) {
    console.error("Error checking slot promotion exists:", error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Checks if a time promotion exists for a specific service/time combination
 */
export async function checkTimePromotionExists(
  beautyPageId: string,
  serviceId: string,
  recurringStartTime: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("promotions")
    .select("*", { count: "exact", head: true })
    .eq("beauty_page_id", beautyPageId)
    .eq("service_id", serviceId)
    .eq("type", "time")
    .eq("recurring_start_time", recurringStartTime)
    .eq("status", "active");

  if (error) {
    console.error("Error checking time promotion exists:", error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Updates the status of a promotion
 */
export async function updatePromotionStatus(
  promotionId: string,
  status: PromotionStatus,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("promotions")
    .update({ status })
    .eq("id", promotionId);

  if (error) {
    console.error("Error updating promotion status:", error.message);
    return false;
  }

  return true;
}

/**
 * Marks a slot promotion as booked by service/date/time
 * Used when creating a booking that matches a slot promotion
 */
export async function markSlotPromotionAsBooked(
  beautyPageId: string,
  serviceId: string,
  slotDate: string,
  slotStartTime: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("promotions")
    .update({ status: "booked" as PromotionStatus })
    .eq("beauty_page_id", beautyPageId)
    .eq("service_id", serviceId)
    .eq("type", "slot")
    .eq("slot_date", slotDate)
    .eq("slot_start_time", slotStartTime)
    .eq("status", "active");

  if (error) {
    console.error("Error marking slot promotion as booked:", error.message);
    return false;
  }

  return true;
}

/**
 * Gets active time promotions for a service that apply to a specific time
 * Used during booking to check if a selected time has a discount
 */
export async function getTimePromotionForSlot(
  beautyPageId: string,
  serviceId: string,
  startTime: string,
  dayOfWeek: number, // 0 = Sunday, 1 = Monday, etc.
): Promise<PublicPromotion | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      id,
      type,
      discount_percentage,
      starts_at,
      ends_at,
      slot_date,
      slot_start_time,
      slot_end_time,
      recurring_start_time,
      recurring_days,
      recurring_valid_until,
      original_price_cents,
      discounted_price_cents,
      service:services (
        id,
        name,
        duration_minutes
      )
    `,
    )
    .eq("beauty_page_id", beautyPageId)
    .eq("service_id", serviceId)
    .eq("type", "time")
    .eq("recurring_start_time", startTime)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching time promotion:", error.message);
    return null;
  }

  // Find a promotion that applies to this day
  type ServiceData = { id: string; name: string; duration_minutes: number };

  const matching = data?.find((promo) => {
    // Check if still valid
    if (promo.recurring_valid_until && promo.recurring_valid_until < today) {
      return false;
    }
    // Check if applies to this day of week (null = every day)
    if (
      promo.recurring_days !== null &&
      !promo.recurring_days.includes(dayOfWeek)
    ) {
      return false;
    }
    return true;
  });

  if (!matching) {
    return null;
  }

  const service = matching.service as unknown as ServiceData;
  return {
    id: matching.id,
    type: matching.type as PromotionType,
    discountPercentage: matching.discount_percentage,
    originalPriceCents: matching.original_price_cents,
    discountedPriceCents: matching.discounted_price_cents,
    startsAt: matching.starts_at,
    endsAt: matching.ends_at,
    slotDate: matching.slot_date,
    slotStartTime: matching.slot_start_time,
    slotEndTime: matching.slot_end_time,
    recurringStartTime: matching.recurring_start_time,
    recurringDays: matching.recurring_days,
    recurringValidUntil: matching.recurring_valid_until,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.duration_minutes,
    },
  };
}

/**
 * Gets the best applicable promotion for a service booking
 * Checks: active sales, slot deals for the specific date/time, time promotions
 * Returns the promotion with the highest discount
 */
export async function getBestPromotionForBooking(
  beautyPageId: string,
  serviceId: string,
  bookingDate: string,
  startTime: string,
): Promise<PublicPromotion | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date(bookingDate).getDay();

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      id,
      type,
      discount_percentage,
      starts_at,
      ends_at,
      slot_date,
      slot_start_time,
      slot_end_time,
      recurring_start_time,
      recurring_days,
      recurring_valid_until,
      original_price_cents,
      discounted_price_cents,
      service:services (
        id,
        name,
        duration_minutes
      )
    `,
    )
    .eq("beauty_page_id", beautyPageId)
    .eq("service_id", serviceId)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching promotions for booking:", error.message);
    return null;
  }

  type ServiceData = { id: string; name: string; duration_minutes: number };

  // Filter to applicable promotions
  const applicable = (data ?? []).filter((promo) => {
    if (promo.type === "sale") {
      // Check date range
      if (promo.starts_at && promo.starts_at > bookingDate) return false;
      if (promo.ends_at && promo.ends_at < bookingDate) return false;
      return true;
    }

    if (promo.type === "slot") {
      // Must match exact date and time
      return (
        promo.slot_date === bookingDate && promo.slot_start_time === startTime
      );
    }

    if (promo.type === "time") {
      // Check if still valid
      if (promo.recurring_valid_until && promo.recurring_valid_until < today) {
        return false;
      }
      // Check time matches
      if (promo.recurring_start_time !== startTime) {
        return false;
      }
      // Check day of week (null = every day)
      if (
        promo.recurring_days !== null &&
        !promo.recurring_days.includes(dayOfWeek)
      ) {
        return false;
      }
      return true;
    }

    return false;
  });

  if (applicable.length === 0) {
    return null;
  }

  // Return the one with highest discount
  const best = applicable.reduce((prev, current) =>
    current.discount_percentage > prev.discount_percentage ? current : prev,
  );

  const service = best.service as unknown as ServiceData;
  return {
    id: best.id,
    type: best.type as PromotionType,
    discountPercentage: best.discount_percentage,
    originalPriceCents: best.original_price_cents,
    discountedPriceCents: best.discounted_price_cents,
    startsAt: best.starts_at,
    endsAt: best.ends_at,
    slotDate: best.slot_date,
    slotStartTime: best.slot_start_time,
    slotEndTime: best.slot_end_time,
    recurringStartTime: best.recurring_start_time,
    recurringDays: best.recurring_days,
    recurringValidUntil: best.recurring_valid_until,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.duration_minutes,
    },
  };
}
