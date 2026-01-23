import { createClient } from "@/lib/supabase/server";
import type { Appointment, WorkingDayWithBreaks } from "./types";

/**
 * Get existing working days for a beauty page (for schedule configuration dialog)
 * Returns all working days from today onwards
 */
export async function getExistingWorkingDays(
  beautyPageId: string,
): Promise<
  Array<{ id: string; date: string; startTime: string; endTime: string }>
> {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("working_days")
    .select("id, date, start_time, end_time")
    .eq("beauty_page_id", beautyPageId)
    .gte("date", today)
    .order("date");

  if (error) {
    console.error("Error fetching existing working days:", error);
    return [];
  }

  return (data ?? []).map((wd) => ({
    id: wd.id,
    date: wd.date,
    startTime: wd.start_time,
    endTime: wd.end_time,
  }));
}

/**
 * Get schedule data for a beauty page within a date range
 */
export async function getScheduleData(
  beautyPageId: string,
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
    .eq("beauty_page_id", beautyPageId)
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
    .eq("beauty_page_id", beautyPageId)
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
      beauty_page_id: wd.beauty_page_id,
      date: wd.date,
      start_time: wd.start_time,
      end_time: wd.end_time,
      slot_interval_minutes: wd.slot_interval_minutes ?? 30,
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
