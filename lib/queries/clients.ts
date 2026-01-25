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
  /** Client's user ID (always present since only authenticated users can book) */
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  avatarUrl: string | null;
  /** Number of completed appointments */
  totalVisits: number;
  /** Total revenue from this client in cents */
  totalSpentCents: number;
  /** Currency code */
  currency: string;
  /** ISO date string of last completed appointment */
  lastVisitDate: string | null;
  /** ISO date string of first completed appointment */
  firstVisitDate: string | null;
  /** Number of no-shows */
  noShowCount: number;
  /** Creator's private notes (null if no notes) */
  creatorNotes: string | null;
  /** When the client was blocked (null if not blocked) */
  blockedAt: string | null;
  /** When the block expires (null = permanent) */
  blockedUntil: string | null;
  /** When the client relationship was created */
  createdAt: string;
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
// RPC Response Types (from database)
// ============================================================================

interface GetBeautyPageClientsRow {
  client_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  notes: string | null;
  blocked_at: string | null;
  blocked_until: string | null;
  no_show_count: number;
  total_visits: number;
  total_spent_cents: number;
  first_visit_at: string | null;
  last_visit_at: string | null;
  created_at: string;
}

interface GetBlockedClientsRow {
  client_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  blocked_at: string;
  blocked_until: string | null;
  no_show_count: number;
  notes: string | null;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get clients for a beauty page using RPC function
 * Returns paginated list of clients with aggregated stats
 * Blocked clients are excluded by default
 */
export async function getBeautyPageClients(
  beautyPageId: string,
  options?: {
    search?: string;
    limit?: number;
    offset?: number;
    includeBlocked?: boolean;
  },
): Promise<BeautyPageClientsResult> {
  const supabase = await createClient();
  const limit = options?.limit ?? CLIENTS_PAGE_SIZE;
  const offset = options?.offset ?? 0;

  const { data, error } = await supabase.rpc("get_beauty_page_clients", {
    p_beauty_page_id: beautyPageId,
    p_search: options?.search || null,
    p_limit: limit + 1, // Fetch one extra to check hasMore
    p_offset: offset,
    p_include_blocked: options?.includeBlocked ?? false,
  });

  if (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }

  const rows = (data as GetBeautyPageClientsRow[]) || [];
  const hasMore = rows.length > limit;
  const clients = rows.slice(0, limit).map(mapRowToClient);

  // Get total count (separate query for accurate count)
  const { count } = await supabase
    .from("beauty_page_clients")
    .select("*", { count: "exact", head: true })
    .eq("beauty_page_id", beautyPageId)
    .is("blocked_at", options?.includeBlocked ? undefined : null);

  return {
    clients,
    total: count ?? clients.length,
    hasMore,
    pageSize: limit,
  };
}

/**
 * Get blocked clients for a beauty page using RPC function
 */
export async function getBlockedClients(
  beautyPageId: string,
): Promise<BeautyPageClient[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_blocked_clients", {
    p_beauty_page_id: beautyPageId,
  });

  if (error) {
    console.error("Error fetching blocked clients:", error);
    throw error;
  }

  return ((data as GetBlockedClientsRow[]) || []).map((row) => ({
    clientId: row.client_id,
    clientName: row.full_name ?? "Unknown",
    clientEmail: row.email,
    avatarUrl: row.avatar_url,
    totalVisits: 0,
    totalSpentCents: 0,
    currency: "UAH",
    lastVisitDate: null,
    firstVisitDate: null,
    noShowCount: row.no_show_count,
    creatorNotes: row.notes,
    blockedAt: row.blocked_at,
    blockedUntil: row.blocked_until,
    createdAt: row.blocked_at,
  }));
}

/**
 * Map database row to BeautyPageClient
 */
function mapRowToClient(row: GetBeautyPageClientsRow): BeautyPageClient {
  return {
    clientId: row.client_id,
    clientName: row.full_name ?? "Unknown",
    clientEmail: row.email,
    avatarUrl: row.avatar_url,
    totalVisits: row.total_visits,
    totalSpentCents: row.total_spent_cents,
    currency: "UAH", // Default currency
    lastVisitDate: row.last_visit_at,
    firstVisitDate: row.first_visit_at,
    noShowCount: row.no_show_count,
    creatorNotes: row.notes,
    blockedAt: row.blocked_at,
    blockedUntil: row.blocked_until,
    createdAt: row.created_at,
  };
}

/**
 * RPC response type from get_client_details
 */
interface ClientDetailsRpcResponse {
  client: {
    clientId: string;
    clientName: string;
    clientEmail: string | null;
    avatarUrl: string | null;
    noShowCount: number;
    creatorNotes: string | null;
    blockedAt: string | null;
    blockedUntil: string | null;
    createdAt: string;
    totalVisits: number;
    totalSpentCents: number;
    averageSpendCents: number;
    firstVisitDate: string | null;
    lastVisitDate: string | null;
    currency: string;
  };
  appointments: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    serviceName: string;
    servicePriceCents: number;
    serviceCurrency: string;
    serviceDurationMinutes: number;
    clientNotes: string | null;
    creatorNotes: string | null;
    cancelledAt: string | null;
    createdAt: string;
  }>;
  servicesBreakdown: Array<{
    serviceName: string;
    count: number;
    totalCents: number;
  }>;
  averageSpendCents: number;
}

/**
 * Get detailed client info including full appointment history
 * Uses RPC function for efficient single-query aggregation
 */
export async function getClientDetails(
  beautyPageId: string,
  clientId: string,
): Promise<ClientDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_client_details", {
    p_beauty_page_id: beautyPageId,
    p_client_id: clientId,
  });

  if (error) {
    console.error("Error fetching client details:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const rpcData = data as ClientDetailsRpcResponse;

  // Transform RPC response to ClientDetails format
  const client: BeautyPageClient = {
    clientId: rpcData.client.clientId,
    clientName: rpcData.client.clientName,
    clientEmail: rpcData.client.clientEmail,
    avatarUrl: rpcData.client.avatarUrl,
    totalVisits: rpcData.client.totalVisits,
    totalSpentCents: rpcData.client.totalSpentCents,
    currency: rpcData.client.currency,
    lastVisitDate: rpcData.client.lastVisitDate,
    firstVisitDate: rpcData.client.firstVisitDate,
    noShowCount: rpcData.client.noShowCount,
    creatorNotes: rpcData.client.creatorNotes,
    blockedAt: rpcData.client.blockedAt,
    blockedUntil: rpcData.client.blockedUntil,
    createdAt: rpcData.client.createdAt,
  };

  const appointments: ClientAppointmentHistory[] = (
    rpcData.appointments ?? []
  ).map((apt) => ({
    id: apt.id,
    date: apt.date,
    startTime: apt.startTime,
    endTime: apt.endTime,
    status: apt.status,
    serviceName: apt.serviceName,
    servicePriceCents: apt.servicePriceCents,
    serviceCurrency: apt.serviceCurrency,
    serviceDurationMinutes: apt.serviceDurationMinutes,
    clientNotes: apt.clientNotes,
    creatorNotes: apt.creatorNotes,
    cancelledAt: apt.cancelledAt,
    createdAt: apt.createdAt,
  }));

  return {
    client,
    appointments,
    servicesBreakdown: rpcData.servicesBreakdown ?? [],
    averageSpendCents: rpcData.averageSpendCents,
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
/**
 * RPC response type from get_client_service_preferences
 */
interface ServicePreferencesRpcResponse {
  services: Array<{
    serviceName: string;
    count: number;
    totalCents: number;
  }>;
  total: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Get paginated service preferences for a client
 * Uses RPC function for efficient SQL GROUP BY with pagination
 */
export async function getServicePreferencesPaginated(
  beautyPageId: string,
  clientId: string,
  options?: ServicePreferencesOptions,
): Promise<ServicePreferencesResult> {
  const supabase = await createClient();

  const search = options?.search?.trim() || null;
  const sort = options?.sort ?? "count";
  const order = options?.order ?? "desc";
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? SERVICE_PREFERENCES_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc("get_client_service_preferences", {
    p_beauty_page_id: beautyPageId,
    p_client_id: clientId,
    p_search: search,
    p_sort: sort,
    p_order: order,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("Error fetching service preferences:", error);
    throw error;
  }

  if (!data) {
    return { services: [], total: 0, totalPages: 0, currentPage: 1 };
  }

  const rpcData = data as ServicePreferencesRpcResponse;

  return {
    services: rpcData.services ?? [],
    total: rpcData.total,
    totalPages: rpcData.totalPages,
    currentPage: rpcData.currentPage,
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
  clientId: string,
  options?: AppointmentsOptions,
): Promise<AppointmentsResult> {
  const supabase = await createClient();

  const sort = options?.sort ?? "date";
  const order = options?.order ?? "desc";
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? APPOINTMENTS_PAGE_SIZE;
  const period = options?.period ?? "all";

  // Calculate date range
  const { fromDate, toDate } = getPeriodDateRange(period);

  // Build query
  let query = supabase
    .from("appointments")
    .select("*")
    .eq("beauty_page_id", beautyPageId)
    .eq("client_id", clientId);

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
  const mappedAppointments: ClientAppointmentHistory[] = appointments.map(
    (apt) => ({
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
    }),
  );

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
  const paginatedAppointments = mappedAppointments.slice(
    offset,
    offset + pageSize,
  );

  return {
    appointments: paginatedAppointments,
    total,
    totalPages,
    currentPage: total === 0 ? 1 : currentPage,
  };
}

// ============================================================================
// Client Notes (using RPC)
// ============================================================================

/**
 * Get creator's notes for a specific client
 */
export async function getClientNotes(
  beautyPageId: string,
  clientId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("beauty_page_clients")
    .select("notes")
    .eq("beauty_page_id", beautyPageId)
    .eq("client_id", clientId)
    .single();

  return data?.notes ?? null;
}

/**
 * Update creator's notes for a specific client
 */
export async function updateClientNotes(
  beautyPageId: string,
  clientId: string,
  notes: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_client_notes", {
    p_beauty_page_id: beautyPageId,
    p_client_id: clientId,
    p_notes: notes,
  });

  if (error) {
    console.error("Error updating client notes:", error);
    return false;
  }

  return true;
}

// ============================================================================
// Client Blocking (using RPC)
// ============================================================================

/**
 * Check if a client is blocked
 */
export async function isClientBlocked(
  beautyPageId: string,
  clientId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("is_client_blocked", {
    p_beauty_page_id: beautyPageId,
    p_client_id: clientId,
  });

  if (error) {
    console.error("Error checking if client is blocked:", error);
    return false;
  }

  return data ?? false;
}

/**
 * Block a client
 */
export async function blockClient(
  beautyPageId: string,
  clientId: string,
  blockedUntil?: string | null,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("block_client", {
    p_beauty_page_id: beautyPageId,
    p_client_id: clientId,
    p_blocked_until: blockedUntil ?? null,
  });

  if (error) {
    console.error("Error blocking client:", error);
    return false;
  }

  return true;
}

/**
 * Unblock a client
 */
export async function unblockClient(
  beautyPageId: string,
  clientId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("unblock_client", {
    p_beauty_page_id: beautyPageId,
    p_client_id: clientId,
  });

  if (error) {
    console.error("Error unblocking client:", error);
    return false;
  }

  return true;
}
