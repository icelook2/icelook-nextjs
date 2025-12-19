"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type {
  SpecialistBookingSettings,
  UpdateBookingSettingsInput,
} from "@/lib/appointments";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ============================================================================
// Get Booking Settings
// ============================================================================

interface GetBookingSettingsParams {
  specialistId: string;
}

/**
 * Get booking settings for a specialist.
 * Returns default values if no settings exist.
 */
export async function getBookingSettings(
  params: GetBookingSettingsParams,
): Promise<ActionResult<SpecialistBookingSettings>> {
  const t = await getTranslations("specialist.settings.booking_settings");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("save_failed") };
  }

  // Verify the specialist belongs to this user
  const { data: specialist } = await supabase
    .from("specialists")
    .select("id, user_id")
    .eq("id", params.specialistId)
    .single();

  if (!specialist || specialist.user_id !== user.id) {
    return { success: false, error: t("save_failed") };
  }

  // Fetch settings
  const { data: settings } = await supabase
    .from("specialist_booking_settings")
    .select("*")
    .eq("specialist_id", params.specialistId)
    .single();

  // Return existing settings or defaults
  if (settings) {
    return { success: true, data: settings as SpecialistBookingSettings };
  }

  // Return default settings
  const defaults: SpecialistBookingSettings = {
    specialist_id: params.specialistId,
    auto_confirm: false,
    min_booking_notice_hours: 2,
    max_booking_days_ahead: 30,
    allow_client_cancellation: true,
    cancellation_notice_hours: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { success: true, data: defaults };
}

// ============================================================================
// Update Booking Settings
// ============================================================================

interface UpdateBookingSettingsParams {
  specialistId: string;
  settings: UpdateBookingSettingsInput;
}

/**
 * Update or create booking settings for a specialist.
 */
export async function updateBookingSettings(
  params: UpdateBookingSettingsParams,
): Promise<ActionResult> {
  const t = await getTranslations("specialist.settings.booking_settings");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("save_failed") };
  }

  // Verify the specialist belongs to this user
  const { data: specialist } = await supabase
    .from("specialists")
    .select("id, user_id, username")
    .eq("id", params.specialistId)
    .single();

  if (!specialist || specialist.user_id !== user.id) {
    return { success: false, error: t("save_failed") };
  }

  // Upsert the settings
  const { error } = await supabase.from("specialist_booking_settings").upsert(
    {
      specialist_id: params.specialistId,
      ...params.settings,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "specialist_id",
    },
  );

  if (error) {
    return { success: false, error: t("save_failed") };
  }

  revalidatePath(`/@${specialist.username}/settings/booking`);

  return { success: true };
}
