import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

/** Default page size for client list */
export const CLIENTS_PAGE_SIZE = 5;

export interface BeautyPageClientsResult {
  clients: BeautyPageClient[];
  total: number;
  hasMore: boolean;
  /** Page size used for pagination - client uses this for subsequent requests */
  pageSize: number;
}

export interface BeautyPageClient {
  /** URL-safe identifier (u_<uuid> for users, g_<base64> for guests) */
  clientKey: string;
  /** Null for guest clients */
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  /** True if client booked as guest (no account) */
  isGuest: boolean;
  /** Number of completed appointments */
  totalVisits: number;
  /** Total revenue from this client in cents */
  totalSpentCents: number;
  /** Currency code */
  currency: string;
  /** ISO date string of last completed appointment */
  lastVisitDate: string;
  /** ISO date string of first completed appointment */
  firstVisitDate: string;
  /** Top services booked by this client */
  topServices: Array<{ serviceName: string; count: number }>;
  /** Creator's private notes (null if no notes or table not created yet) */
  creatorNotes: string | null;
}

export interface ClientAppointmentHistory {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string;
  servicePriceCents: number;
  serviceCurrency: string;
  serviceDurationMinutes: number;
  /** Notes from the client at booking time */
  clientNotes: string | null;
  /** Creator's private notes about this appointment */
  creatorNotes: string | null;
  /** When the appointment was cancelled (if applicable) */
  cancelledAt: string | null;
  /** When the appointment was created */
  createdAt: string;
}

export interface ClientDetails {
  client: BeautyPageClient;
  appointments: ClientAppointmentHistory[];
  /** Services breakdown sorted by count */
  servicesBreakdown: Array<{
    serviceName: string;
    count: number;
    totalCents: number;
  }>;
  /** Average spending per visit in cents */
  averageSpendCents: number;
}

// ============================================================================
// URL Encoding for Client Keys
// ============================================================================

/**
 * Encode client identifier for use in URLs
 * - Authenticated users: "u_<uuid>"
 * - Guests: "g_<base64url(phone)>"
 */
export function encodeClientKey(clientId: string | null, clientPhone: string): string {
  if (clientId) {
    return `u_${clientId}`;
  }
  // Use base64url encoding for phone (URL-safe)
  return `g_${Buffer.from(normalizePhone(clientPhone)).toString("base64url")}`;
}

/**
 * Decode client key back to identifier
 */
export function decodeClientKey(key: string): {
  clientId: string | null;
  clientPhone: string | null;
} {
  if (key.startsWith("u_")) {
    return { clientId: key.slice(2), clientPhone: null };
  }
  if (key.startsWith("g_")) {
    const phone = Buffer.from(key.slice(2), "base64url").toString();
    return { clientId: null, clientPhone: phone };
  }
  throw new Error(`Invalid client key format: ${key}`);
}

/**
 * Normalize phone number for consistent matching
 * Strips spaces, dashes, parentheses
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get clients for a beauty page with aggregated stats and pagination
 * Clients are sorted alphabetically by name
 */
export async function getBeautyPageClients(
  beautyPageId: string,
  options?: {
    search?: string;
    limit?: number;
    offset?: number;
  },
): Promise<BeautyPageClientsResult> {
  const supabase = await createClient();
  const limit = options?.limit ?? CLIENTS_PAGE_SIZE;
  const offset = options?.offset ?? 0;

  // Fetch all completed appointments for aggregation
  // Note: We need all appointments to properly aggregate client data
  // Pagination happens after aggregation
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      "client_id, client_name, client_phone, client_email, date, service_name, service_price_cents, service_currency, status",
    )
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "completed")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching appointments for clients:", error);
    throw error;
  }

  if (!appointments || appointments.length === 0) {
    return { clients: [], total: 0, hasMore: false, pageSize: limit };
  }

  // Try to fetch creator notes (table may not exist yet)
  const notesMap = new Map<string, string>();
  try {
    const { data: notes } = await supabase
      .from("client_notes")
      .select("client_id, client_phone, notes")
      .eq("beauty_page_id", beautyPageId);

    if (notes) {
      for (const note of notes) {
        const key = note.client_id
          ? `u_${note.client_id}`
          : `g_${normalizePhone(note.client_phone ?? "")}`;
        notesMap.set(key, note.notes ?? "");
      }
    }
  } catch {
    // Table doesn't exist yet - that's okay
  }

  // Aggregate appointments by client
  const clientMap = new Map<
    string,
    {
      clientId: string | null;
      clientName: string;
      clientPhone: string;
      clientEmail: string | null;
      appointments: typeof appointments;
    }
  >();

  for (const apt of appointments) {
    // Use client_id if available, otherwise use normalized phone
    const key = apt.client_id
      ? `u_${apt.client_id}`
      : `g_${normalizePhone(apt.client_phone)}`;

    const existing = clientMap.get(key);
    if (existing) {
      existing.appointments.push(apt);
      // Update name/email to latest (in case they changed)
      existing.clientName = apt.client_name;
      if (apt.client_email) {
        existing.clientEmail = apt.client_email;
      }
    } else {
      clientMap.set(key, {
        clientId: apt.client_id,
        clientName: apt.client_name,
        clientPhone: apt.client_phone,
        clientEmail: apt.client_email,
        appointments: [apt],
      });
    }
  }

  // Build client list with aggregated data
  let clients: BeautyPageClient[] = [];

  for (const [key, data] of clientMap) {
    const totalVisits = data.appointments.length;
    const totalSpentCents = data.appointments.reduce(
      (sum, a) => sum + a.service_price_cents,
      0,
    );

    // Get dates (appointments are already sorted desc)
    const lastVisitDate = data.appointments[0].date;
    const firstVisitDate = data.appointments[data.appointments.length - 1].date;

    // Get currency from first appointment
    const currency = data.appointments[0].service_currency;

    // Count services
    const serviceCount = new Map<string, number>();
    for (const apt of data.appointments) {
      serviceCount.set(apt.service_name, (serviceCount.get(apt.service_name) ?? 0) + 1);
    }
    const topServices = Array.from(serviceCount.entries())
      .map(([serviceName, count]) => ({ serviceName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    clients.push({
      clientKey: key,
      clientId: data.clientId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail,
      isGuest: !data.clientId,
      totalVisits,
      totalSpentCents,
      currency,
      lastVisitDate,
      firstVisitDate,
      topServices,
      creatorNotes: notesMap.get(key) ?? null,
    });
  }

  // Apply search filter (server-side)
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(searchLower) ||
        c.clientPhone.includes(options.search!),
    );
  }

  // Sort alphabetically by name (A-Z)
  clients.sort((a, b) => a.clientName.localeCompare(b.clientName));

  // Get total before pagination
  const total = clients.length;

  // Apply pagination
  const paginatedClients = clients.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    clients: paginatedClients,
    total,
    hasMore,
    pageSize: limit,
  };
}

/**
 * Get detailed client info including full appointment history
 */
export async function getClientDetails(
  beautyPageId: string,
  clientKey: string,
): Promise<ClientDetails | null> {
  const supabase = await createClient();
  const { clientId, clientPhone } = decodeClientKey(clientKey);

  // Build query based on client type
  let query = supabase
    .from("appointments")
    .select("*")
    .eq("beauty_page_id", beautyPageId);

  if (clientId) {
    query = query.eq("client_id", clientId);
  } else if (clientPhone) {
    // For guests, match by normalized phone
    // Note: This assumes phone numbers are stored consistently
    query = query.eq("client_phone", clientPhone);
  } else {
    return null;
  }

  const { data: appointments, error } = await query.order("date", { ascending: false });

  if (error) {
    console.error("Error fetching client details:", error);
    throw error;
  }

  if (!appointments || appointments.length === 0) {
    return null;
  }

  // Filter to completed only for stats
  const completedAppointments = appointments.filter((a) => a.status === "completed");

  if (completedAppointments.length === 0) {
    return null;
  }

  // Get latest client info
  const latestApt = appointments[0];
  const latestCompleted = completedAppointments[0];
  const oldestCompleted = completedAppointments[completedAppointments.length - 1];

  // Calculate totals
  const totalSpentCents = completedAppointments.reduce(
    (sum, a) => sum + a.service_price_cents,
    0,
  );
  const averageSpendCents =
    completedAppointments.length > 0
      ? Math.round(totalSpentCents / completedAppointments.length)
      : 0;

  // Services breakdown
  const serviceMap = new Map<string, { count: number; totalCents: number }>();
  for (const apt of completedAppointments) {
    const existing = serviceMap.get(apt.service_name) ?? { count: 0, totalCents: 0 };
    serviceMap.set(apt.service_name, {
      count: existing.count + 1,
      totalCents: existing.totalCents + apt.service_price_cents,
    });
  }
  const servicesBreakdown = Array.from(serviceMap.entries())
    .map(([serviceName, data]) => ({
      serviceName,
      count: data.count,
      totalCents: data.totalCents,
    }))
    .sort((a, b) => b.count - a.count);

  // Top services for the client object
  const topServices = servicesBreakdown.slice(0, 3).map((s) => ({
    serviceName: s.serviceName,
    count: s.count,
  }));

  // Try to get creator notes
  let creatorNotes: string | null = null;
  try {
    let notesQuery = supabase
      .from("client_notes")
      .select("notes")
      .eq("beauty_page_id", beautyPageId);

    if (clientId) {
      notesQuery = notesQuery.eq("client_id", clientId);
    } else if (clientPhone) {
      notesQuery = notesQuery.eq("client_phone", clientPhone);
    }

    const { data: notesData } = await notesQuery.single();
    creatorNotes = notesData?.notes ?? null;
  } catch {
    // Table doesn't exist yet
  }

  // Build client object
  const client: BeautyPageClient = {
    clientKey,
    clientId: latestApt.client_id,
    clientName: latestApt.client_name,
    clientPhone: latestApt.client_phone,
    clientEmail: latestApt.client_email,
    isGuest: !latestApt.client_id,
    totalVisits: completedAppointments.length,
    totalSpentCents,
    currency: latestCompleted.service_currency,
    lastVisitDate: latestCompleted.date,
    firstVisitDate: oldestCompleted.date,
    topServices,
    creatorNotes,
  };

  // Map all appointments to history format
  const appointmentHistory: ClientAppointmentHistory[] = appointments.map((apt) => ({
    id: apt.id,
    date: apt.date,
    startTime: apt.start_time,
    endTime: apt.end_time,
    status: apt.status,
    serviceName: apt.service_name,
    servicePriceCents: apt.service_price_cents,
    serviceCurrency: apt.service_currency,
    serviceDurationMinutes: apt.service_duration_minutes,
    clientNotes: apt.client_notes,
    creatorNotes: apt.creator_notes,
    cancelledAt: apt.cancelled_at,
    createdAt: apt.created_at,
  }));

  return {
    client,
    appointments: appointmentHistory,
    servicesBreakdown,
    averageSpendCents,
  };
}

// ============================================================================
// Service Preferences Paginated Query
// ============================================================================

/** Page size for service preferences list */
export const SERVICE_PREFERENCES_PAGE_SIZE = 10;

export type ServicePreferencesSortField = "count" | "total" | "name";
export type SortOrder = "asc" | "desc";

export interface ServicePreference {
  serviceName: string;
  count: number;
  totalCents: number;
}

export interface ServicePreferencesOptions {
  search?: string;
  sort?: ServicePreferencesSortField;
  order?: SortOrder;
  page?: number;
  pageSize?: number;
}

export interface ServicePreferencesResult {
  services: ServicePreference[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Get paginated service preferences for a client
 * Supports search, sorting, and pagination
 */
export async function getServicePreferencesPaginated(
  beautyPageId: string,
  clientKey: string,
  options?: ServicePreferencesOptions,
): Promise<ServicePreferencesResult> {
  const supabase = await createClient();
  const { clientId, clientPhone } = decodeClientKey(clientKey);

  const search = options?.search?.trim().toLowerCase();
  const sort = options?.sort ?? "count";
  const order = options?.order ?? "desc";
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? SERVICE_PREFERENCES_PAGE_SIZE;

  // Build query based on client type
  let query = supabase
    .from("appointments")
    .select("service_name, service_price_cents")
    .eq("beauty_page_id", beautyPageId)
    .eq("status", "completed");

  if (clientId) {
    query = query.eq("client_id", clientId);
  } else if (clientPhone) {
    query = query.eq("client_phone", clientPhone);
  } else {
    return { services: [], total: 0, totalPages: 0, currentPage: 1 };
  }

  const { data: appointments, error } = await query;

  if (error) {
    console.error("Error fetching service preferences:", error);
    throw error;
  }

  if (!appointments || appointments.length === 0) {
    return { services: [], total: 0, totalPages: 0, currentPage: 1 };
  }

  // Aggregate services
  const serviceMap = new Map<string, { count: number; totalCents: number }>();
  for (const apt of appointments) {
    const existing = serviceMap.get(apt.service_name) ?? {
      count: 0,
      totalCents: 0,
    };
    serviceMap.set(apt.service_name, {
      count: existing.count + 1,
      totalCents: existing.totalCents + apt.service_price_cents,
    });
  }

  // Convert to array
  let services: ServicePreference[] = Array.from(serviceMap.entries()).map(
    ([serviceName, data]) => ({
      serviceName,
      count: data.count,
      totalCents: data.totalCents,
    }),
  );

  // Apply search filter
  if (search) {
    services = services.filter((s) =>
      s.serviceName.toLowerCase().includes(search),
    );
  }

  // Apply sorting
  services.sort((a, b) => {
    let comparison = 0;
    switch (sort) {
      case "count":
        comparison = a.count - b.count;
        break;
      case "total":
        comparison = a.totalCents - b.totalCents;
        break;
      case "name":
        comparison = a.serviceName.localeCompare(b.serviceName);
        break;
    }
    return order === "asc" ? comparison : -comparison;
  });

  // Calculate pagination
  const total = services.length;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const offset = (currentPage - 1) * pageSize;

  // Apply pagination
  const paginatedServices = services.slice(offset, offset + pageSize);

  return {
    services: paginatedServices,
    total,
    totalPages,
    currentPage: total === 0 ? 1 : currentPage,
  };
}

// ============================================================================
// Appointments Paginated Query
// ============================================================================

/** Page size for appointments list */
export const APPOINTMENTS_PAGE_SIZE = 10;

export type AppointmentsSortField = "date" | "service" | "price";

export type AppointmentsPeriod =
  | "all"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year";

export interface AppointmentsOptions {
  sort?: AppointmentsSortField;
  order?: SortOrder;
  page?: number;
  pageSize?: number;
  period?: AppointmentsPeriod;
}

export interface AppointmentsResult {
  appointments: ClientAppointmentHistory[];
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Calculate date range for a given period
 */
function getPeriodDateRange(period: AppointmentsPeriod): {
  fromDate: string | null;
  toDate: string | null;
} {
  if (period === "all") {
    return { fromDate: null, toDate: null };
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  let fromDate: string;

  switch (period) {
    case "this_week": {
      // Start from Monday of current week
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToMonday);
      fromDate = monday.toISOString().split("T")[0];
      break;
    }
    case "this_month": {
      fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      break;
    }
    case "last_month": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        fromDate: lastMonth.toISOString().split("T")[0],
        toDate: lastMonthEnd.toISOString().split("T")[0],
      };
    }
    case "last_3_months": {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      fromDate = threeMonthsAgo.toISOString().split("T")[0];
      break;
    }
    case "this_year": {
      fromDate = `${now.getFullYear()}-01-01`;
      break;
    }
    default:
      return { fromDate: null, toDate: null };
  }

  return { fromDate, toDate: today };
}

/**
 * Get paginated appointments for a client
 * Supports sorting, pagination, and date filtering
 */
export async function getAppointmentsPaginated(
  beautyPageId: string,
  clientKey: string,
  options?: AppointmentsOptions,
): Promise<AppointmentsResult> {
  const supabase = await createClient();
  const { clientId, clientPhone } = decodeClientKey(clientKey);

  const sort = options?.sort ?? "date";
  const order = options?.order ?? "desc";
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? APPOINTMENTS_PAGE_SIZE;
  const period = options?.period ?? "all";

  // Calculate date range
  const { fromDate, toDate } = getPeriodDateRange(period);

  // Build query based on client type
  let query = supabase
    .from("appointments")
    .select("*")
    .eq("beauty_page_id", beautyPageId);

  if (clientId) {
    query = query.eq("client_id", clientId);
  } else if (clientPhone) {
    query = query.eq("client_phone", clientPhone);
  } else {
    return { appointments: [], total: 0, totalPages: 0, currentPage: 1 };
  }

  // Apply date filters
  if (fromDate) {
    query = query.gte("date", fromDate);
  }
  if (toDate) {
    query = query.lte("date", toDate);
  }

  const { data: appointments, error } = await query;

  if (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }

  if (!appointments || appointments.length === 0) {
    return { appointments: [], total: 0, totalPages: 0, currentPage: 1 };
  }

  // Map to ClientAppointmentHistory format
  let mappedAppointments: ClientAppointmentHistory[] = appointments.map((apt) => ({
    id: apt.id,
    date: apt.date,
    startTime: apt.start_time,
    endTime: apt.end_time,
    status: apt.status,
    serviceName: apt.service_name,
    servicePriceCents: apt.service_price_cents,
    serviceCurrency: apt.service_currency,
    serviceDurationMinutes: apt.service_duration_minutes,
    clientNotes: apt.client_notes,
    creatorNotes: apt.creator_notes,
    cancelledAt: apt.cancelled_at,
    createdAt: apt.created_at,
  }));

  // Apply sorting
  mappedAppointments.sort((a, b) => {
    let comparison = 0;
    switch (sort) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "service":
        comparison = a.serviceName.localeCompare(b.serviceName);
        break;
      case "price":
        comparison = a.servicePriceCents - b.servicePriceCents;
        break;
    }
    return order === "asc" ? comparison : -comparison;
  });

  // Calculate pagination
  const total = mappedAppointments.length;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const offset = (currentPage - 1) * pageSize;

  // Apply pagination
  const paginatedAppointments = mappedAppointments.slice(offset, offset + pageSize);

  return {
    appointments: paginatedAppointments,
    total,
    totalPages,
    currentPage: total === 0 ? 1 : currentPage,
  };
}
