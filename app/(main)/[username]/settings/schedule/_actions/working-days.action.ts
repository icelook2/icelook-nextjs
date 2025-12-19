"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { WorkingDayWithBreaks } from "@/lib/schedule/types";
import { createClient } from "@/lib/supabase/server";
import type { WorkingDayFormData } from "../schemas";
import { workingDaySchema } from "../schemas";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

/**
 * Get working days for a date range.
 */
export async function getWorkingDays(
  specialistId: string,
  startDate: string,
  endDate: string,
): Promise<ActionResult<WorkingDayWithBreaks[]>> {
  const supabase = await createClient();

  const { data: workingDays, error } = await supabase
    .from("working_days")
    .select(
      `
      *,
      working_day_breaks (*)
    `,
    )
    .eq("specialist_id", specialistId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: workingDays as WorkingDayWithBreaks[] };
}

/**
 * Get a single working day by date.
 */
export async function getWorkingDay(
  specialistId: string,
  date: string,
): Promise<ActionResult<WorkingDayWithBreaks | null>> {
  const supabase = await createClient();

  const { data: workingDay, error } = await supabase
    .from("working_days")
    .select(
      `
      *,
      working_day_breaks (*)
    `,
    )
    .eq("specialist_id", specialistId)
    .eq("date", date)
    .single();

  if (error && error.code !== "PGRST116") {
    return { success: false, error: error.message };
  }

  return { success: true, data: workingDay as WorkingDayWithBreaks | null };
}

/**
 * Create or update a working day.
 */
export async function upsertWorkingDay(
  specialistId: string,
  data: WorkingDayFormData,
): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("schedule");
  const tValidation = await getTranslations("validation");

  // Validate input
  const validation = workingDaySchema.safeParse(data);
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

  const { date, startTime, endTime, breaks } = validation.data;

  // Upsert working day
  const { data: workingDay, error: dayError } = await supabase
    .from("working_days")
    .upsert(
      {
        specialist_id: specialistId,
        date,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      },
      {
        onConflict: "specialist_id,date",
      },
    )
    .select("id")
    .single();

  if (dayError || !workingDay) {
    console.error("Failed to upsert working day:", dayError);
    return { success: false, error: t("save_failed") };
  }

  // Delete existing breaks
  const { error: deleteError } = await supabase
    .from("working_day_breaks")
    .delete()
    .eq("working_day_id", workingDay.id);

  if (deleteError) {
    console.error("Failed to delete existing breaks:", deleteError);
    // Continue anyway, breaks will be added
  }

  // Insert new breaks
  if (breaks.length > 0) {
    const { error: breaksError } = await supabase
      .from("working_day_breaks")
      .insert(
        breaks.map((br) => ({
          working_day_id: workingDay.id,
          start_time: `${br.start}:00`,
          end_time: `${br.end}:00`,
        })),
      );

    if (breaksError) {
      console.error("Failed to insert breaks:", breaksError);
      // Don't fail the whole operation for breaks
    }
  }

  revalidatePath(`/@${specialist.username}/settings/schedule`);

  return { success: true, data: { id: workingDay.id } };
}

/**
 * Delete a working day (mark as day off).
 */
export async function deleteWorkingDay(
  specialistId: string,
  date: string,
): Promise<ActionResult> {
  const t = await getTranslations("schedule");

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

  // Delete working day (breaks cascade automatically)
  const { error } = await supabase
    .from("working_days")
    .delete()
    .eq("specialist_id", specialistId)
    .eq("date", date);

  if (error) {
    console.error("Failed to delete working day:", error);
    return { success: false, error: t("delete_failed") };
  }

  revalidatePath(`/@${specialist.username}/settings/schedule`);

  return { success: true };
}

/**
 * Delete multiple working days.
 */
export async function deleteWorkingDays(
  specialistId: string,
  dates: string[],
): Promise<ActionResult<{ count: number }>> {
  const t = await getTranslations("schedule");

  if (dates.length === 0) {
    return { success: true, data: { count: 0 } };
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

  // Delete working days
  const { error, count } = await supabase
    .from("working_days")
    .delete({ count: "exact" })
    .eq("specialist_id", specialistId)
    .in("date", dates);

  if (error) {
    console.error("Failed to delete working days:", error);
    return { success: false, error: t("delete_failed") };
  }

  revalidatePath(`/@${specialist.username}/settings/schedule`);

  return { success: true, data: { count: count ?? 0 } };
}
