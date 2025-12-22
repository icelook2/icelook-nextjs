import { createClient } from "@/lib/supabase/server";
import type {
  Appointment,
  ScheduleConfig,
  WorkingDayWithBreaks,
} from "./types";

/**
 * Get schedule data for a specialist within a date range
 */
export async function getScheduleData(
  specialistId: string,
  startDate: string,
  endDate: string,
): Promise<{
  workingDays: WorkingDayWithBreaks[];
  appointments: Appointment[];
}> {
  const supabase = await createClient();

  // Fetch working days with breaks
  const { data: workingDays, error: workingDaysError } = await supabase
    .from("working_days")
    .select("*, working_day_breaks (*)")
    .eq("specialist_id", specialistId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  if (workingDaysError) {
    console.error("Error fetching working days:", workingDaysError);
  }

  // Fetch appointments
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .eq("specialist_id", specialistId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date")
    .order("start_time");

  if (appointmentsError) {
    console.error("Error fetching appointments:", appointmentsError);
  }

  // Transform working days to include breaks array
  const workingDaysWithBreaks: WorkingDayWithBreaks[] = (workingDays ?? []).map(
    (wd) => ({
      id: wd.id,
      specialist_id: wd.specialist_id,
      date: wd.date,
      start_time: wd.start_time,
      end_time: wd.end_time,
      created_at: wd.created_at,
      updated_at: wd.updated_at,
      breaks: wd.working_day_breaks ?? [],
    }),
  );

  return {
    workingDays: workingDaysWithBreaks,
    appointments: (appointments ?? []) as Appointment[],
  };
}

/**
 * Get schedule configuration for a specialist
 */
export async function getScheduleConfig(
  specialistId: string,
): Promise<ScheduleConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialist_schedule_config")
    .select("*")
    .eq("specialist_id", specialistId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching schedule config:", error);
    return null;
  }

  return data;
}

/**
 * Get specialist by user ID (to map from beauty page member to specialist)
 */
export async function getSpecialistByUserId(
  userId: string,
): Promise<{ id: string; username: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("specialists")
    .select("id, username")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching specialist:", error);
    return null;
  }

  return data;
}

/**
 * Create specialist record if it doesn't exist
 * This is needed because the schedule tables reference the specialists table
 */
export async function ensureSpecialistExists(
  userId: string,
  displayName: string,
  username: string,
): Promise<string | null> {
  const supabase = await createClient();

  // Check if specialist already exists
  const { data: existing } = await supabase
    .from("specialists")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  // Create new specialist record
  const { data: created, error } = await supabase
    .from("specialists")
    .insert({
      user_id: userId,
      username,
      display_name: displayName,
      specialty: "General", // Default value
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating specialist:", error);
    return null;
  }

  return created.id;
}
