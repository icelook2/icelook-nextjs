"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname, getBeautyPageClients } from "@/lib/queries";
import type { BeautyPageClientsResult } from "@/lib/queries/clients";
import { CLIENTS_PAGE_SIZE, updateClientNotes } from "@/lib/queries/clients";

const upsertClientNotesSchema = z.object({
  beautyPageId: z.string().uuid(),
  nickname: z.string(),
  clientId: z.string().uuid(),
  notes: z.string().max(5000),
});

type UpsertClientNotesInput = z.infer<typeof upsertClientNotesSchema>;

export async function upsertClientNotes(
  input: UpsertClientNotesInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validated = upsertClientNotesSchema.parse(input);

    // Auth check
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user is beauty page owner
    const beautyPage = await getBeautyPageByNickname(validated.nickname);
    if (!beautyPage || beautyPage.owner_id !== profile.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (beautyPage.id !== validated.beautyPageId) {
      return { success: false, error: "Invalid beauty page" };
    }

    // Update notes using RPC function
    const success = await updateClientNotes(
      validated.beautyPageId,
      validated.clientId,
      validated.notes,
    );

    if (!success) {
      return { success: false, error: "Failed to save notes" };
    }

    // Revalidate the client detail page
    revalidatePath(`/${validated.nickname}/settings/clients`);

    return { success: true };
  } catch (error) {
    console.error("Error in upsertClientNotes:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================================================
// Load More / Search Clients
// ============================================================================

const loadClientsSchema = z.object({
  nickname: z.string(),
  search: z.string().optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(CLIENTS_PAGE_SIZE),
});

type LoadClientsInput = z.infer<typeof loadClientsSchema>;

export async function loadClients(
  input: LoadClientsInput,
): Promise<BeautyPageClientsResult & { error?: string }> {
  try {
    // Validate input
    const validated = loadClientsSchema.parse(input);

    // Auth check
    const profile = await getProfile();
    if (!profile) {
      return {
        clients: [],
        total: 0,
        hasMore: false,
        pageSize: validated.limit,
        error: "Unauthorized",
      };
    }

    // Verify user is beauty page owner
    const beautyPage = await getBeautyPageByNickname(validated.nickname);
    if (!beautyPage || beautyPage.owner_id !== profile.id) {
      return {
        clients: [],
        total: 0,
        hasMore: false,
        pageSize: validated.limit,
        error: "Unauthorized",
      };
    }

    // Fetch clients with pagination
    const result = await getBeautyPageClients(beautyPage.id, {
      search: validated.search,
      offset: validated.offset,
      limit: validated.limit,
    });

    return result;
  } catch (error) {
    console.error("Error in loadClients:", error);
    return {
      clients: [],
      total: 0,
      hasMore: false,
      pageSize: CLIENTS_PAGE_SIZE,
      error: "An unexpected error occurred",
    };
  }
}
