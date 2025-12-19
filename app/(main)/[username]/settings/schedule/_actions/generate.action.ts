"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { generateFromPattern } from "@/lib/schedule/pattern-generators";
import { createClient } from "@/lib/supabase/server";
import type { SchedulePatternFormData } from "../schemas";
import { schedulePatternSchema } from "../schemas";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Generate working days from a pattern.
 */
export async function generateWorkingDaysFromPattern(
  specialistId: string,
  pattern: SchedulePatternFormData,
  options: {
    /** If true, overwrite existing working days. If false, skip existing dates. */
    overwriteExisting?: boolean;
  } = {},
): Promise<ActionResult<{ created: number; updated: number }>> {
  const t = await getTranslations("schedule");
  const tValidation = await getTranslations("validation");

  // Validate pattern
  const validation = schedulePatternSchema.safeParse(pattern);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return {
      success: false,
      error: issue.message || tValidation("invalid_data"),
    };
  }

  const supabase = await createClient();

  // Verify ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Check specialist belongs to user
  const { data: specialist } = await supabase
    .from("specialists")
    .select("id, username")
    .eq("id", specialistId)
    .eq("user_id", user.id)
    .single();

  if (!specialist) {
    return { success: false, error: t("not_authorized") };
  }

  // Generate working days from pattern
  const generatedDays = generateFromPattern(validation.data);

  if (generatedDays.length === 0) {
    return { success: true, data: { created: 0, updated: 0 } };
  }

  // Get existing working days for the date range
  const dates = generatedDays.map((d) => d.date);
  const { data: existingDays } = await supabase
    .from("working_days")
    .select("id, date")
    .eq("specialist_id", specialistId)
    .in("date", dates);

  const existingDatesSet = new Set(existingDays?.map((d) => d.date) ?? []);

  // Prepare data for insert
  const daysToInsert = generatedDays
    .filter((day) => {
      const exists = existingDatesSet.has(day.date);
      return !exists || options.overwriteExisting;
    })
    .map((day) => ({
      specialist_id: specialistId,
      date: day.date,
      start_time: `${day.startTime}:00`,
      end_time: `${day.endTime}:00`,
    }));

  if (daysToInsert.length === 0) {
    return { success: true, data: { created: 0, updated: 0 } };
  }

  // Upsert working days
  const { data: insertedDays, error: insertError } = await supabase
    .from("working_days")
    .upsert(daysToInsert, {
      onConflict: "specialist_id,date",
    })
    .select("id, date");

  if (insertError) {
    console.error("Failed to generate working days:", insertError);
    return { success: false, error: t("generation_failed") };
  }

  // Create a map of date -> working_day_id
  const dateToIdMap = new Map<string, string>();
  for (const day of insertedDays ?? []) {
    dateToIdMap.set(day.date, day.id);
  }

  // Delete existing breaks for upserted days
  if (insertedDays && insertedDays.length > 0) {
    const insertedIds = insertedDays.map((d) => d.id);
    await supabase
      .from("working_day_breaks")
      .delete()
      .in("working_day_id", insertedIds);
  }

  // Insert breaks for all generated days
  const breaksToInsert: Array<{
    working_day_id: string;
    start_time: string;
    end_time: string;
  }> = [];

  for (const day of generatedDays) {
    const workingDayId = dateToIdMap.get(day.date);
    if (!workingDayId) {
      continue;
    }

    for (const br of day.breaks) {
      breaksToInsert.push({
        working_day_id: workingDayId,
        start_time: `${br.start}:00`,
        end_time: `${br.end}:00`,
      });
    }
  }

  if (breaksToInsert.length > 0) {
    const { error: breaksError } = await supabase
      .from("working_day_breaks")
      .insert(breaksToInsert);

    if (breaksError) {
      console.error("Failed to insert breaks:", breaksError);
      // Don't fail the whole operation for breaks
    }
  }

  // Count created vs updated
  const createdCount = daysToInsert.filter(
    (d) => !existingDatesSet.has(d.date),
  ).length;
  const updatedCount = daysToInsert.length - createdCount;

  revalidatePath(`/@${specialist.username}/settings/schedule`);

  return {
    success: true,
    data: {
      created: createdCount,
      updated: updatedCount,
    },
  };
}

/**
 * Preview pattern generation without saving.
 */
export async function previewPatternGeneration(
  specialistId: string,
  pattern: SchedulePatternFormData,
): Promise<
  ActionResult<{
    totalDays: number;
    newDays: number;
    existingDays: number;
    preview: Array<{ date: string; startTime: string; endTime: string }>;
  }>
> {
  const tValidation = await getTranslations("validation");

  // Validate pattern
  const validation = schedulePatternSchema.safeParse(pattern);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return {
      success: false,
      error: issue.message || tValidation("invalid_data"),
    };
  }

  // Generate working days from pattern
  const generatedDays = generateFromPattern(validation.data);

  if (generatedDays.length === 0) {
    return {
      success: true,
      data: {
        totalDays: 0,
        newDays: 0,
        existingDays: 0,
        preview: [],
      },
    };
  }

  const supabase = await createClient();

  // Get existing working days for the date range
  const dates = generatedDays.map((d) => d.date);
  const { data: existingDays } = await supabase
    .from("working_days")
    .select("date")
    .eq("specialist_id", specialistId)
    .in("date", dates);

  const existingDatesSet = new Set(existingDays?.map((d) => d.date) ?? []);

  const newDays = generatedDays.filter(
    (d) => !existingDatesSet.has(d.date),
  ).length;
  const existingCount = generatedDays.length - newDays;

  return {
    success: true,
    data: {
      totalDays: generatedDays.length,
      newDays,
      existingDays: existingCount,
      preview: generatedDays.slice(0, 10).map((d) => ({
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
      })),
    },
  };
}
