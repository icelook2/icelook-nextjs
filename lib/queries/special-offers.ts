import { createClient } from "@/lib/supabase/server";

// Special offer status type (database enum placeholder)
type SpecialOfferStatus = "active" | "booked" | "expired";

// Special offer row type (database table placeholder)
type SpecialOfferRow = {
  id: string;
  beauty_page_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  discount_percentage: number;
  original_price_cents: number;
  discounted_price_cents: number;
  status: SpecialOfferStatus;
  created_at: string;
  updated_at: string;
};

/**
 * Special offer with joined service data for display
 */
export type SpecialOfferWithService = SpecialOfferRow & {
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    service_group_id: string;
  };
};

/**
 * Simplified special offer for public display on beauty pages
 */
export type PublicSpecialOffer = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  discountPercentage: number;
  originalPriceCents: number;
  discountedPriceCents: number;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
};

/**
 * Fetches active special offers for public display on a beauty page
 * Only returns active offers with date >= today
 */
export async function getActiveSpecialOffers(
  beautyPageId: string,
): Promise<PublicSpecialOffer[]> {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("special_offers")
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      discount_percentage,
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
    .gte("date", today)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    // Silently return empty array - table may not exist yet
    return [];
  }

  // Transform to camelCase for frontend
  // Type the service as a single object (Supabase returns object for FK relations)
  type ServiceData = { id: string; name: string; duration_minutes: number };

  return (data ?? []).map((offer) => {
    const service = offer.service as unknown as ServiceData;
    return {
      id: offer.id,
      date: offer.date,
      startTime: offer.start_time,
      endTime: offer.end_time,
      discountPercentage: offer.discount_percentage,
      originalPriceCents: offer.original_price_cents,
      discountedPriceCents: offer.discounted_price_cents,
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.duration_minutes,
      },
    };
  });
}

/**
 * Fetches all special offers for a beauty page (for creator settings)
 * Includes all statuses: active, booked, expired
 */
export async function getAllSpecialOffers(
  beautyPageId: string,
): Promise<SpecialOfferWithService[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("special_offers")
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
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Error fetching all special offers:", error);
    return [];
  }

  return (data ?? []) as SpecialOfferWithService[];
}

/**
 * Fetches a single special offer by ID
 */
export async function getSpecialOfferById(
  offerId: string,
): Promise<SpecialOfferWithService | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("special_offers")
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
    .eq("id", offerId)
    .single();

  if (error) {
    console.error("Error fetching special offer:", error);
    return null;
  }

  return data as SpecialOfferWithService;
}

/**
 * Checks if a special offer exists for a specific service/date/time combination
 */
export async function checkSpecialOfferExists(
  beautyPageId: string,
  serviceId: string,
  date: string,
  startTime: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("special_offers")
    .select("*", { count: "exact", head: true })
    .eq("beauty_page_id", beautyPageId)
    .eq("service_id", serviceId)
    .eq("date", date)
    .eq("start_time", startTime)
    .eq("status", "active");

  if (error) {
    console.error("Error checking special offer exists:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Updates the status of a special offer
 * Used when an appointment is created for the special offer slot
 */
export async function updateSpecialOfferStatus(
  offerId: string,
  status: SpecialOfferStatus,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("special_offers")
    .update({ status })
    .eq("id", offerId);

  if (error) {
    console.error("Error updating special offer status:", error);
    return false;
  }

  return true;
}

/**
 * Marks a special offer as booked by service/date/time
 * Used when creating a booking that matches a special offer slot
 */
export async function markSpecialOfferAsBooked(
  beautyPageId: string,
  serviceId: string,
  date: string,
  startTime: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("special_offers")
    .update({ status: "booked" as SpecialOfferStatus })
    .eq("beauty_page_id", beautyPageId)
    .eq("service_id", serviceId)
    .eq("date", date)
    .eq("start_time", startTime)
    .eq("status", "active");

  if (error) {
    console.error("Error marking special offer as booked:", error);
    return false;
  }

  return true;
}
