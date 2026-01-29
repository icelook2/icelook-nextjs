"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS } from "@/lib/validation/schemas";
import { createBeautyPageFlowSchema } from "../_lib/schemas";

type CreateBeautyPageFlowResult =
  | { success: true; nickname: string; beautyPageId: string }
  | { success: false; error: string };

/**
 * Create a beauty page with optional services and first working day
 * This is the main action for the create beauty page flow
 */
export async function createBeautyPageFlow(input: {
  name: string;
  nickname: string;
  instagram: string | null;
  telegram: string | null;
  phone: string | null;
  services: Array<{
    name: string;
    priceCents: number;
    durationMinutes: number;
  }>;
  firstWorkingDay: {
    date: string;
    startTime: string;
    endTime: string;
  } | null;
}): Promise<CreateBeautyPageFlowResult> {
  const t = await getTranslations("create_beauty_page");
  const tValidation = await getTranslations("validation");

  // Validate input
  const validation = createBeautyPageFlowSchema.safeParse(input);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    const path = issue.path[0] as string;

    if (path === "name") {
      return {
        success: false,
        error: tValidation("beauty_page_name_too_short"),
      };
    }
    if (path === "nickname") {
      return {
        success: false,
        error: tValidation("beauty_page_slug_invalid_format"),
      };
    }

    return { success: false, error: tValidation("invalid_input") };
  }

  const { name, nickname, services, firstWorkingDay } = validation.data;

  // Contact fields are not validated by schema, take directly from input
  const instagram = input.instagram;
  const telegram = input.telegram;
  const phone = input.phone;

  // Check for reserved slugs
  if (RESERVED_SLUGS.includes(nickname as (typeof RESERVED_SLUGS)[number])) {
    return { success: false, error: tValidation("beauty_page_slug_reserved") };
  }

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("errors.not_authenticated") };
  }

  // Check if slug is already taken
  const { data: existingPage } = await supabase
    .from("beauty_pages")
    .select("id")
    .eq("slug", nickname)
    .single();

  if (existingPage) {
    return { success: false, error: tValidation("beauty_page_slug_taken") };
  }

  // ============================================================================
  // Create beauty page
  // ============================================================================

  // Convert social usernames to full URLs if provided
  const instagramUrl = instagram
    ? `https://instagram.com/${instagram.replace(/^@/, "")}`
    : null;

  const telegramUrl = telegram
    ? `https://t.me/${telegram.replace(/^@/, "")}`
    : null;

  const { data: beautyPage, error: beautyPageError } = await supabase
    .from("beauty_pages")
    .insert({
      name,
      slug: nickname,
      owner_id: user.id,
      instagram_url: instagramUrl,
      telegram_url: telegramUrl,
      phone: phone || null,
    })
    .select("id")
    .single();

  if (beautyPageError || !beautyPage) {
    console.error("Error creating beauty page:", beautyPageError);
    return { success: false, error: t("errors.create_failed") };
  }

  const beautyPageId = beautyPage.id;

  // ============================================================================
  // Create services (if any)
  // ============================================================================

  if (services.length > 0) {
    // First, create a default service group
    const { data: serviceGroup, error: groupError } = await supabase
      .from("service_groups")
      .insert({
        beauty_page_id: beautyPageId,
        name: "Services", // Default group name
        display_order: 0,
      })
      .select("id")
      .single();

    if (groupError) {
      console.error("Error creating service group:", groupError);
      // Don't fail the whole flow, just log the error
    } else if (serviceGroup) {
      // Create all services
      const servicesToInsert = services.map((service, index) => ({
        service_group_id: serviceGroup.id,
        name: service.name,
        price_cents: service.priceCents,
        duration_minutes: service.durationMinutes,
        display_order: index,
      }));

      const { error: servicesError } = await supabase
        .from("services")
        .insert(servicesToInsert);

      if (servicesError) {
        console.error("Error creating services:", servicesError);
        // Don't fail the whole flow, just log the error
      }
    }
  }

  // ============================================================================
  // Create first working day (if provided)
  // ============================================================================

  if (firstWorkingDay) {
    const { error: workingDayError } = await supabase
      .from("working_days")
      .insert({
        beauty_page_id: beautyPageId,
        date: firstWorkingDay.date,
        start_time: `${firstWorkingDay.startTime}:00`,
        end_time: `${firstWorkingDay.endTime}:00`,
        // slot_interval_minutes defaults to 30 at DB level
      });

    if (workingDayError) {
      console.error("Error creating first working day:", workingDayError);
      // Don't fail the whole flow, just log the error
    }
  }

  // ============================================================================
  // Revalidate paths
  // ============================================================================

  revalidatePath("/settings");
  revalidatePath("/beauty-pages");
  revalidatePath(`/${nickname}`);

  return { success: true, nickname, beautyPageId };
}
