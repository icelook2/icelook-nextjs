"use client";

import { format } from "date-fns";
import { enUS, uk } from "date-fns/locale";
import {
  CalendarCog,
  CalendarOff,
  CalendarPlus,
  Clock,
  EllipsisVertical,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { Menu } from "@/lib/ui/menu";
import {
  deleteWorkingDay,
  getAppointmentsForWorkingDay,
  getWorkingDaysForReschedule,
  type DayOffAppointment,
} from "../_actions/working-day.actions";
import { ConfigureScheduleDialog } from "./configure-schedule";
import { DayOffAppointmentsDialog } from "./day-off-appointments";
import { EditWorkingHoursDialog } from "./edit-working-hours-dialog";

const localeMap = { en: enUS, uk } as const;

interface WorkingDayInfo {
  id: string;
  startTime: string;
  endTime: string;
}

interface ScheduleMenuProps {
  selectedDate: Date;
  workingDay: WorkingDayInfo | null;
  beautyPageId: string;
  nickname: string;
  /** Working day dates for configure schedule dialog (YYYY-MM-DD format) */
  workingDates?: Set<string>;
}

/**
 * Dropdown menu for schedule-level actions
 *
 * Provides quick access to:
 * - Mark as day off / Configure as working day
 * - Edit working hours for the selected day
 * - Configure working days (opens schedule wizard)
 */
export function ScheduleMenu({
  selectedDate,
  workingDay,
  beautyPageId,
  nickname,
  workingDates,
}: ScheduleMenuProps) {
  const menuId = useId();
  const t = useTranslations("creator_schedule");
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale as keyof typeof localeMap] ?? enUS;
  const [isPending, startTransition] = useTransition();
  const [editHoursOpen, setEditHoursOpen] = useState(false);
  const [configureScheduleOpen, setConfigureScheduleOpen] = useState(false);

  // Day-off dialog state
  const [dayOffDialogOpen, setDayOffDialogOpen] = useState(false);
  const [dayOffAppointments, setDayOffAppointments] = useState<
    DayOffAppointment[]
  >([]);
  const [workingDaysForReschedule, setWorkingDaysForReschedule] = useState<
    Array<{ date: string; startTime: string; endTime: string }>
  >([]);

  const isWorkingDay = workingDay !== null;
  const formattedDate = format(selectedDate, "d MMMM", {
    locale: dateFnsLocale,
  });

  const handleMarkAsDayOff = () => {
    if (!workingDay) {
      return;
    }

    startTransition(async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // First, check if there are any appointments on this day
      const appointmentsResult = await getAppointmentsForWorkingDay({
        beautyPageId,
        date: dateStr,
      });

      if (!appointmentsResult.success) {
        console.error(appointmentsResult.error);
        return;
      }

      const appointments = appointmentsResult.data ?? [];

      if (appointments.length === 0) {
        // No appointments - delete working day directly
        const result = await deleteWorkingDay({
          id: workingDay.id,
          beautyPageId,
          nickname,
        });

        if (!result.success) {
          console.error(result.error);
        }
      } else {
        // Has appointments - fetch working days for rescheduling and open dialog
        const workingDaysResult = await getWorkingDaysForReschedule({
          beautyPageId,
          excludeDate: dateStr,
        });

        setDayOffAppointments(appointments);
        setWorkingDaysForReschedule(
          workingDaysResult.success ? (workingDaysResult.data ?? []) : [],
        );
        setDayOffDialogOpen(true);
      }
    });
  };

  const handleConfigureWorkingDay = () => {
    // Open edit dialog in "create" mode
    setEditHoursOpen(true);
  };

  const handleEditHours = () => {
    setEditHoursOpen(true);
  };

  const handleConfigureSchedule = () => {
    setConfigureScheduleOpen(true);
  };

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          id={menuId}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:bg-accent hover:text-white data-[popup-open]:bg-accent data-[popup-open]:text-white"
          aria-label={t("menu.label")}
        >
          <EllipsisVertical className="size-5" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content align="end">
            <Menu.Group>
              <Menu.GroupLabel>{formattedDate}</Menu.GroupLabel>
              {isWorkingDay ? (
                <>
                  <Menu.Item icon={Clock} onClick={handleEditHours}>
                    {t("menu.edit_hours")}
                  </Menu.Item>
                  <Menu.Item
                    icon={CalendarOff}
                    variant="danger"
                    onClick={handleMarkAsDayOff}
                    disabled={isPending}
                  >
                    {t("menu.mark_day_off")}
                  </Menu.Item>
                </>
              ) : (
                <Menu.Item
                  icon={CalendarPlus}
                  onClick={handleConfigureWorkingDay}
                >
                  {t("menu.configure_day")}
                </Menu.Item>
              )}
            </Menu.Group>
            <Menu.Separator />
            <Menu.Item icon={CalendarCog} onClick={handleConfigureSchedule}>
              {t("menu.configure_schedule")}
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      <EditWorkingHoursDialog
        open={editHoursOpen}
        onOpenChange={setEditHoursOpen}
        selectedDate={selectedDate}
        workingDay={workingDay}
        beautyPageId={beautyPageId}
        nickname={nickname}
      />

      <ConfigureScheduleDialog
        open={configureScheduleOpen}
        onOpenChange={setConfigureScheduleOpen}
        existingWorkingDates={workingDates ?? new Set()}
        beautyPageId={beautyPageId}
        nickname={nickname}
      />

      {workingDay && (
        <DayOffAppointmentsDialog
          open={dayOffDialogOpen}
          onOpenChange={setDayOffDialogOpen}
          workingDayId={workingDay.id}
          workingDayDate={selectedDate}
          beautyPageId={beautyPageId}
          nickname={nickname}
          appointments={dayOffAppointments}
          workingDays={workingDaysForReschedule}
        />
      )}
    </>
  );
}
