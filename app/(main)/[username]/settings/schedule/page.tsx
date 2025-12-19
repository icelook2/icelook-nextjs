import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth/session";
import { getMonthDateRange } from "@/lib/schedule/pattern-generators";
import type {
  ScheduleConfig,
  WorkingDayWithBreaks,
} from "@/lib/schedule/types";
import { createClient } from "@/lib/supabase/server";
import { ScheduleManager } from "./_components/schedule-manager";

interface SchedulePageProps {
  params: Promise<{ username: string }>;
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { username } = await params;
  const t = await getTranslations("schedule");

  // Require authentication
  const user = await requireAuth();

  const supabase = await createClient();

  // Get specialist by username
  const { data: specialist } = await supabase
    .from("specialists")
    .select("id, username, user_id")
    .eq("username", username)
    .single();

  if (!specialist) {
    notFound();
  }

  // Verify ownership
  if (specialist.user_id !== user.id) {
    notFound();
  }

  // Get schedule config
  const { data: configData } = await supabase
    .from("specialist_schedule_config")
    .select("timezone, default_slot_duration")
    .eq("specialist_id", specialist.id)
    .single();

  // Default config if not exists
  const config: ScheduleConfig = configData
    ? {
        specialist_id: specialist.id,
        timezone: configData.timezone,
        default_slot_duration: configData.default_slot_duration as
          | 5
          | 10
          | 15
          | 30
          | 60,
        created_at: "",
        updated_at: "",
      }
    : {
        specialist_id: specialist.id,
        timezone: "Europe/Kyiv",
        default_slot_duration: 30,
        created_at: "",
        updated_at: "",
      };

  // Get current month's working days
  const now = new Date();
  const { startDate, endDate } = getMonthDateRange(
    now.getFullYear(),
    now.getMonth(),
  );

  const { data: workingDaysData } = await supabase
    .from("working_days")
    .select(
      `
      *,
      working_day_breaks (*)
    `,
    )
    .eq("specialist_id", specialist.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  const workingDays = (workingDaysData ?? []) as WorkingDayWithBreaks[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-foreground/60 mt-1">{t("description")}</p>
      </div>

      <ScheduleManager
        specialistId={specialist.id}
        initialConfig={config}
        initialWorkingDays={workingDays}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth()}
      />
    </div>
  );
}
