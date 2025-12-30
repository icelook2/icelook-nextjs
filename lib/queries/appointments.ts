import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/** Label assigned to a specialist */
export type SpecialistLabelInfo = {
  id: string;
  name: string;
  color: string | null;
};

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
  | "specialist_display_name"
  | "specialist_id"
  | "client_notes"
  | "created_at"
> & {
  /** Specialist's avatar URL */
  specialist_avatar_url: string | null;
  /** Labels assigned to the specialist */
  specialist_labels: SpecialistLabelInfo[];
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
      specialist_display_name,
      specialist_id,
      client_notes,
      created_at,
      beauty_pages!appointments_beauty_page_id_fkey (
        name,
        slug,
        logo_url,
        address
      ),
      beauty_page_specialists!appointments_specialist_id_fkey (
        avatar_url,
        specialist_label_assignments!specialist_label_assignments_specialist_id_fkey (
          specialist_labels!specialist_label_assignments_label_id_fkey (
            id,
            name,
            color
          )
        )
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

    // Get specialist data - also a to-one relationship (object, not array)
    const specialistData = row.beauty_page_specialists;
    const specialist = Array.isArray(specialistData)
      ? specialistData[0]
      : specialistData;

    // Extract labels from specialist_label_assignments (to-many, so it's an array)
    // Each assignment has specialist_labels as a to-one relationship (object)
    const labels: SpecialistLabelInfo[] =
      specialist?.specialist_label_assignments
        ?.map((assignment) => {
          const labelData = assignment.specialist_labels;
          if (!labelData) {
            return null;
          }
          // specialist_labels is a to-one FK, so it's an object
          const label = Array.isArray(labelData) ? labelData[0] : labelData;
          if (!label) {
            return null;
          }
          return {
            id: label.id,
            name: label.name,
            color: label.color,
          };
        })
        .filter((label): label is SpecialistLabelInfo => label !== null) ?? [];

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
      specialist_display_name: row.specialist_display_name,
      specialist_id: row.specialist_id,
      client_notes: row.client_notes,
      created_at: row.created_at,
      specialist_avatar_url: specialist?.avatar_url ?? null,
      specialist_labels: labels,
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
