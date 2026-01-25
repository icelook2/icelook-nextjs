"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS } from "@/lib/validation/schemas";
import { createBeautyPageFlowSchema } from "../_lib/schemas";
import { jsWeekdayToOurs } from "../_lib/types";

type CreateBeautyPageFlowResult =
  | { success: true; nickname: string }
  | { success: false; error: string };

/**
 * Create a beauty page with optional services and working days
 * This is the main action for the create beauty page flow
 */
export async function createBeautyPageFlow(input: {
  name: string;
  nickname: string;
  services: Array<{
    name: string;
    priceCents: number;
    durationMinutes: number;
  }>;
  selectedDates: string[];
  weekdayHours: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
  }>;
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

  const { name, nickname, services, selectedDates, weekdayHours } =
    validation.data;

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

  const { data: beautyPage, error: beautyPageError } = await supabase
    .from("beauty_pages")
    .insert({
      name,
      slug: nickname,
      owner_id: user.id,
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
  // Create working days (if any selected dates)
  // ============================================================================

  if (selectedDates.length > 0 && weekdayHours.length > 0) {
    // Build a map of weekday -> hours for quick lookup
    const hoursMap = new Map<number, { startTime: string; endTime: string }>();
    for (const hours of weekdayHours) {
      hoursMap.set(hours.weekday, {
        startTime: hours.startTime,
        endTime: hours.endTime,
      });
    }

    const workingDaysToCreate: Array<{
      beauty_page_id: string;
      date: string;
      start_time: string;
      end_time: string;
    }> = [];

    // For each selected date, find the corresponding hours
    for (const dateStr of selectedDates) {
      const date = new Date(dateStr);
      const jsWeekday = date.getDay(); // 0 = Sunday, 6 = Saturday
      const ourWeekday = jsWeekdayToOurs(jsWeekday); // 0 = Monday, 6 = Sunday

      const hours = hoursMap.get(ourWeekday);
      if (hours) {
        workingDaysToCreate.push({
          beauty_page_id: beautyPageId,
          date: dateStr,
          start_time: `${hours.startTime}:00`,
          end_time: `${hours.endTime}:00`,
          // slot_interval_minutes defaults to 30 at DB level
        });
      }
    }

    if (workingDaysToCreate.length > 0) {
      const { error: workingDaysError } = await supabase
        .from("working_days")
        .insert(workingDaysToCreate);

      if (workingDaysError) {
        console.error("Error creating working days:", workingDaysError);
        // Don't fail the whole flow, just log the error
      }
    }
  }

  // ============================================================================
  // Revalidate paths
  // ============================================================================

  revalidatePath("/settings");
  revalidatePath("/beauty-pages");
  revalidatePath(`/${nickname}`);

  return { success: true, nickname };
}
