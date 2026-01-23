"use server";

/**
 * Blocklist Management Server Actions
 *
 * Allows creators to manage their client blocklist.
 * Blocked clients cannot book appointments with the beauty page.
 */

import {
  blockClient,
  getBlockedClients,
  getNoShowRecords,
  resetNoShowCount,
  unblockClient,
} from "@/lib/queries/booking-restrictions";
import type { BlockedClient, ClientNoShow } from "@/lib/types/booking-restrictions";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// Types
// ============================================================================

interface ActionResult {
  success: boolean;
  error?: string;
}

interface BlockedClientWithInfo extends BlockedClient {
  clientDisplayName: string;
}

interface NoShowRecordWithInfo extends ClientNoShow {
  clientDisplayName: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get blocked clients for a beauty page with display names
 */
export async function getBlockedClientsForPage(
  beautyPageId: string,
): Promise<BlockedClientWithInfo[]> {
  const supabase = await createClient();

  // Verify the user owns this beauty page
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", beautyPageId)
    .single();

  if (!beautyPage || beautyPage.owner_id !== user.id) {
    return [];
  }

  const blockedClients = await getBlockedClients(beautyPageId);

  // Enrich with display names
  return blockedClients.map((client) => ({
    ...client,
    clientDisplayName: getClientDisplayName(client),
  }));
}

/**
 * Get no-show records for a beauty page with display names
 */
export async function getNoShowRecordsForPage(
  beautyPageId: string,
): Promise<NoShowRecordWithInfo[]> {
  const supabase = await createClient();

  // Verify the user owns this beauty page
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", beautyPageId)
    .single();

  if (!beautyPage || beautyPage.owner_id !== user.id) {
    return [];
  }

  const noShowRecords = await getNoShowRecords(beautyPageId);

  // Enrich with display names
  return noShowRecords.map((record) => ({
    ...record,
    clientDisplayName: getClientDisplayName(record),
  }));
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Block a client from booking
 */
export async function blockClientAction(
  beautyPageId: string,
  clientPhone: string,
  clientEmail: string | null,
  reason?: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  // Verify the user owns this beauty page
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id, slug")
    .eq("id", beautyPageId)
    .single();

  if (!beautyPage || beautyPage.owner_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  // Look up client_id from appointments if they have booked before
  const { data: existingAppointment } = await supabase
    .from("appointments")
    .select("client_id")
    .eq("beauty_page_id", beautyPageId)
    .eq("client_phone", clientPhone)
    .not("client_id", "is", null)
    .limit(1)
    .single();

  const result = await blockClient(
    beautyPageId,
    user.id,
    {
      clientId: existingAppointment?.client_id ?? undefined,
      clientPhone,
      clientEmail: clientEmail ?? undefined,
    },
    reason,
  );

  if (result.success) {
    revalidatePath(`/${beautyPage.slug}/settings/clients`);
  }

  return result;
}

/**
 * Unblock a client
 */
export async function unblockClientAction(
  beautyPageId: string,
  clientPhone: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  // Verify the user owns this beauty page
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id, slug")
    .eq("id", beautyPageId)
    .single();

  if (!beautyPage || beautyPage.owner_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const result = await unblockClient(beautyPageId, { clientPhone });

  if (result.success) {
    revalidatePath(`/${beautyPage.slug}/settings/clients`);
  }

  return result;
}

/**
 * Reset no-show count for a client (forgive them)
 */
export async function resetNoShowCountAction(
  beautyPageId: string,
  clientPhone: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  // Verify the user owns this beauty page
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id, slug")
    .eq("id", beautyPageId)
    .single();

  if (!beautyPage || beautyPage.owner_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const result = await resetNoShowCount(beautyPageId, { clientPhone });

  if (result.success) {
    revalidatePath(`/${beautyPage.slug}/settings/clients`);
  }

  return result;
}

/**
 * Block a client from an appointment (quick action from appointment view)
 */
export async function blockClientFromAppointment(
  appointmentId: string,
  reason?: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  // Verify the user owns this appointment's beauty page
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get appointment with beauty page info
  const { data: appointment } = await supabase
    .from("appointments")
    .select(`
      id,
      client_id,
      client_phone,
      client_email,
      beauty_page_id,
      beauty_pages!inner(owner_id, slug)
    `)
    .eq("id", appointmentId)
    .single();

  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  const beautyPageData = appointment.beauty_pages as unknown as {
    owner_id: string;
    slug: string;
  };

  if (beautyPageData.owner_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const result = await blockClient(
    appointment.beauty_page_id,
    user.id,
    {
      clientId: appointment.client_id ?? undefined,
      clientPhone: appointment.client_phone ?? undefined,
      clientEmail: appointment.client_email ?? undefined,
    },
    reason,
  );

  if (result.success) {
    revalidatePath(`/${beautyPageData.slug}/settings/clients`);
    revalidatePath(`/${beautyPageData.slug}/appointments`);
  }

  return result;
}

// ============================================================================
// Helpers
// ============================================================================

function getClientDisplayName(
  client: Pick<BlockedClient | ClientNoShow, "client_phone" | "client_email">,
): string {
  if (client.client_phone) {
    // Format phone for display
    return client.client_phone;
  }
  if (client.client_email) {
    return client.client_email;
  }
  return "Unknown client";
}
