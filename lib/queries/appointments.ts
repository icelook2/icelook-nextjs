import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ClientAppointment = Pick<
  Tables<"appointments">,
  | "id"
  | "date"
  | "start_time"
  | "end_time"
  | "timezone"
  | "status"
  | "service_name"
  | "service_price_cents"
  | "service_currency"
  | "service_duration_minutes"
  | "creator_display_name"
  | "client_notes"
  | "created_at"
> & {
  /** Creator's avatar URL (from beauty page) */
  creator_avatar_url: string | null;
  /** Beauty page name where the service is provided */
  beauty_page_name: string | null;
  /** Beauty page slug for navigation (e.g., /beauty-salon) */
  beauty_page_slug: string | null;
  /** Beauty page logo/avatar URL */
  beauty_page_avatar_url: string | null;
  /** Beauty page address */
  beauty_page_address: string | null;
};

/**
 * Fetches all appointments for a client, split into upcoming and past
 * - Upcoming: date >= today AND status is pending/confirmed, sorted ascending (closest first)
 * - Past: date < today OR terminal status (completed/cancelled/no_show), sorted descending (most recent first)
 */
export async function getClientAppointments(
  clientId: string,
): Promise<{ upcoming: ClientAppointment[]; past: ClientAppointment[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      timezone,
      status,
      service_name,
      service_price_cents,
      service_currency,
      service_duration_minutes,
      creator_display_name,
      client_notes,
      created_at,
      beauty_pages!appointments_beauty_page_id_fkey (
        name,
        slug,
        logo_url,
        avatar_url,
        address
      )
    `,
    )
    .eq("client_id", clientId);

  if (error) {
    console.error("Error fetching client appointments:", error);
    throw error;
  }

  // Transform nested data into flat structure
  const appointments: ClientAppointment[] = (data ?? []).map((row) => {
    // Get beauty page - Supabase returns object for to-one FK relationships
    // Handle both object and array cases for safety
    const beautyPageData = row.beauty_pages;
    const beautyPage = Array.isArray(beautyPageData)
      ? beautyPageData[0]
      : beautyPageData;

    return {
      id: row.id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      timezone: row.timezone,
      status: row.status,
      service_name: row.service_name,
      service_price_cents: row.service_price_cents,
      service_currency: row.service_currency,
      service_duration_minutes: row.service_duration_minutes,
      creator_display_name: row.creator_display_name,
      client_notes: row.client_notes,
      created_at: row.created_at,
      // Creator avatar comes from beauty page in solo creator model
      creator_avatar_url:
        beautyPage?.avatar_url ?? beautyPage?.logo_url ?? null,
      beauty_page_name: beautyPage?.name ?? null,
      beauty_page_slug: beautyPage?.slug ?? null,
      beauty_page_avatar_url: beautyPage?.logo_url ?? null,
      beauty_page_address: beautyPage?.address ?? null,
    };
  });

  const today = new Date().toISOString().split("T")[0];

  // Upcoming: future dates with active statuses (pending/confirmed)
  const upcoming = appointments
    .filter(
      (a) =>
        a.date >= today && (a.status === "pending" || a.status === "confirmed"),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.start_time.localeCompare(b.start_time),
    );

  // Past: past dates OR terminal statuses (completed/cancelled/no_show)
  const past = appointments
    .filter(
      (a) =>
        a.date < today ||
        a.status === "completed" ||
        a.status === "cancelled" ||
        a.status === "no_show",
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.start_time.localeCompare(a.start_time),
    );

  return { upcoming, past };
}
