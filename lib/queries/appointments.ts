import type { Tables, Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export type AppointmentStatus = Enums<"appointment_status">;

/** Individual service within an appointment */
export type AppointmentService = Pick<
  Tables<"appointment_services">,
  "id" | "service_name" | "price_cents" | "duration_minutes"
>;

/** Appointment with individual services */
export type Appointment = Tables<"appointments"> & {
  appointment_services: AppointmentService[];
};

/** Last appointment data for display (matches AppointmentCard requirements) */
export interface LastAppointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  client_name: string;
  client_phone: string;
  service_name: string;
  service_price_cents: number;
  service_currency: string;
}

/** Summarized client history for the appointment details page */
export interface ClientHistorySummary {
  /** Number of completed appointments with this creator */
  totalVisits: number;
  /** Total revenue from this client in cents */
  totalSpentCents: number;
  /** Currency code */
  currency: string;
  /** The last completed appointment */
  lastAppointment: LastAppointment | null;
}

// ============================================================================
// Creator-side Queries (for appointment details page)
// ============================================================================

/**
 * Get a single appointment by ID for a beauty page
 * Used on the appointment details page
 */
export async function getAppointmentById(
  beautyPageId: string,
  appointmentId: string,
): Promise<Appointment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      appointment_services (
        id,
        service_name,
        price_cents,
        duration_minutes
      )
    `,
    )
    .eq("id", appointmentId)
    .eq("beauty_page_id", beautyPageId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Error fetching appointment:", error);
    throw error;
  }

  return data;
}

/**
 * Get summarized client history for showing on appointment details page
 * Matches client by client_id (if authenticated) or normalized phone (if guest)
 */
export async function getClientHistoryForAppointment(
  beautyPageId: string,
  clientId: string | null,
  clientPhone: string,
): Promise<ClientHistorySummary | null> {
  const supabase = await createClient();

  // Build query to match client
  let query = supabase
    .from("appointments")
    .select(
      "id, date, start_time, end_time, status, client_name, client_phone, service_name, service_price_cents, service_currency",
    )
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "completed");

  if (clientId) {
    // Authenticated client - match by ID
    query = query.eq("client_id", clientId);
  } else {
    // Guest client - match by phone
    query = query.eq("client_phone", clientPhone);
  }

  const { data: appointments, error } = await query.order("date", {
    ascending: false,
  });

  if (error) {
    console.error("Error fetching client history:", error);
    throw error;
  }

  if (!appointments || appointments.length === 0) {
    return null;
  }

  // Calculate stats
  const totalVisits = appointments.length;
  const totalSpentCents = appointments.reduce(
    (sum, a) => sum + a.service_price_cents,
    0,
  );
  const currency = appointments[0].service_currency;

  // Last appointment is the first one (sorted by date desc)
  const last = appointments[0];
  const lastAppointment: LastAppointment = {
    id: last.id,
    date: last.date,
    start_time: last.start_time,
    end_time: last.end_time,
    status: last.status,
    client_name: last.client_name,
    client_phone: last.client_phone,
    service_name: last.service_name,
    service_price_cents: last.service_price_cents,
    service_currency: last.service_currency,
  };

  return {
    totalVisits,
    totalSpentCents,
    currency,
    lastAppointment,
  };
}

/**
 * Get the next appointment after a given time on the same date
 * Used to check for overlap when adding services to an appointment
 */
export async function getNextAppointment(
  beautyPageId: string,
  date: string,
  afterTime: string,
  excludeAppointmentId?: string,
): Promise<{ start_time: string; client_name: string } | null> {
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("start_time, client_name")
    .eq("beauty_page_id", beautyPageId)
    .eq("date", date)
    .gt("start_time", afterTime)
    .not("status", "in", '("cancelled","no_show")')
    .order("start_time", { ascending: true })
    .limit(1);

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error fetching next appointment:", error);
    throw error;
  }

  return data;
}

// ============================================================================
// Client-side Queries (for client's appointment history)
// ============================================================================

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
