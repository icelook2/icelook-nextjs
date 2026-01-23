"use server";

/**
 * Blocklist Management Server Actions
 *
 * Allows creators to manage their client blocklist.
 * Blocked clients cannot book appointments with the beauty page.
 * Uses the beauty_page_clients junction table for blocking.
 */

import {
  blockClient,
  getBlockedClients,
  unblockClient,
  type BeautyPageClient,
} from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// Types
// ============================================================================

interface ActionResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get blocked clients for a beauty page
 */
export async function getBlockedClientsForPage(
  beautyPageId: string,
): Promise<BeautyPageClient[]> {
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

  return getBlockedClients(beautyPageId);
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Block a client from booking
 * Uses the block_client RPC function
 */
export async function blockClientAction(
  beautyPageId: string,
  clientId: string,
  blockedUntil?: string | null,
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

  const success = await blockClient(beautyPageId, clientId, blockedUntil);

  if (success) {
    revalidatePath(`/${beautyPage.slug}/settings/clients`);
    revalidatePath(`/${beautyPage.slug}/settings/blocked-clients`);
    return { success: true };
  }

  return { success: false, error: "Failed to block client" };
}

/**
 * Unblock a client
 * Uses the unblock_client RPC function
 */
export async function unblockClientAction(
  beautyPageId: string,
  clientId: string,
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

  const success = await unblockClient(beautyPageId, clientId);

  if (success) {
    revalidatePath(`/${beautyPage.slug}/settings/clients`);
    revalidatePath(`/${beautyPage.slug}/settings/blocked-clients`);
    return { success: true };
  }

  return { success: false, error: "Failed to unblock client" };
}

/**
 * Block a client from an appointment (quick action from appointment view)
 */
export async function blockClientFromAppointment(
  appointmentId: string,
  blockedUntil?: string | null,
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
      beauty_page_id,
      beauty_pages!inner(owner_id, slug)
    `)
    .eq("id", appointmentId)
    .single();

  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  if (!appointment.client_id) {
    return { success: false, error: "No client associated with this appointment" };
  }

  const beautyPageData = appointment.beauty_pages as unknown as {
    owner_id: string;
    slug: string;
  };

  if (beautyPageData.owner_id !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const success = await blockClient(
    appointment.beauty_page_id,
    appointment.client_id,
    blockedUntil,
  );

  if (success) {
    revalidatePath(`/${beautyPageData.slug}/settings/clients`);
    revalidatePath(`/${beautyPageData.slug}/settings/blocked-clients`);
    revalidatePath(`/${beautyPageData.slug}/appointments`);
    return { success: true };
  }

  return { success: false, error: "Failed to block client" };
}
