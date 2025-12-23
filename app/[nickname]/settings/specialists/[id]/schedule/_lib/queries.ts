import { createClient } from "@/lib/supabase/server";
import type { Appointment, WorkingDayWithBreaks } from "./types";

/**
 * Get schedule data for a specialist within a date range
 * The specialistId is beauty_page_specialists.id
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
