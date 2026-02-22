"use client";

import { isBefore, startOfDay } from "date-fns";
import { CalendarOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { Paper } from "@/lib/ui/paper";
import type { Appointment, WorkingDayBreak } from "../_lib/types";
import { AppointmentCard } from "./appointment-card";
import { BreakCard } from "./break-card";
import { AvailableSlot, PastEmptySlot } from "./free-slot-variants";
import { QuickBookingDialog, type SelectedSlot } from "./quick-booking";

type FilterType = "all" | "confirmed" | "pending";

interface FreeSlotsViewProps {
  selectedDate: Date;
  startTime: string;
  endTime: string;
  breaks: WorkingDayBreak[];
  appointments: Appointment[];
  nickname: string;
  isConfigured: boolean;
  slotIntervalMinutes?: number;
  beautyPageId: string;
  serviceGroups: ServiceGroupWithServices[];
  clients: BeautyPageClient[];
  currency: string;
  hideAvailableSlots?: boolean;
  /** Filter appointments by status */
  filter?: FilterType;
}

type TimelineItem =
  | { type: "appointment"; data: Appointment; startMinutes: number }
  | { type: "break"; data: WorkingDayBreak; startMinutes: number }
  | {
      type: "free";
      startTime: string;
      durationMinutes: number;
      startMinutes: number;
    };

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function buildTimeline(
  startTime: string,
  endTime: string,
  breaks: WorkingDayBreak[],
  appointments: Appointment[],
  intervalMinutes: number,
): TimelineItem[] {
  const items: TimelineItem[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const activeAppointments = appointments.filter(
    (apt) => apt.status !== "cancelled" && apt.status !== "no_show",
  );

  for (const apt of activeAppointments) {
    items.push({
      type: "appointment",
      data: apt,
      startMinutes: timeToMinutes(apt.start_time),
    });
  }

  for (const brk of breaks) {
    items.push({
      type: "break",
      data: brk,
      startMinutes: timeToMinutes(brk.start_time),
    });
  }

  const blockedRanges = [
    ...breaks.map((b) => ({
      start: timeToMinutes(b.start_time),
      end: timeToMinutes(b.end_time),
    })),
    ...activeAppointments.map((apt) => ({
      start: timeToMinutes(apt.start_time),
      end: timeToMinutes(apt.end_time),
    })),
  ].sort((a, b) => a.start - b.start);

  for (
    let minutes = startMinutes;
    minutes < endMinutes;
    minutes += intervalMinutes
  ) {
    const slotStart = minutes;
    const slotEnd = minutes + intervalMinutes;

    const isBlocked = blockedRanges.some(
      (range) => slotStart < range.end && slotEnd > range.start,
    );

    if (isBlocked) {
      continue;
    }

    let nextEventMinutes = endMinutes;
    for (const range of blockedRanges) {
      if (range.start > slotStart) {
        nextEventMinutes = Math.min(nextEventMinutes, range.start);
        break;
      }
    }

    const durationMinutes = nextEventMinutes - slotStart;

    items.push({
      type: "free",
      startTime: minutesToTime(slotStart),
      durationMinutes,
      startMinutes: slotStart,
    });
  }

  items.sort((a, b) => a.startMinutes - b.startMinutes);

  return items;
}

export function FreeSlotsView({
  selectedDate,
  startTime,
  endTime,
  breaks,
  appointments,
  nickname,
  isConfigured,
  slotIntervalMinutes = 30,
  beautyPageId,
  serviceGroups,
  clients,
  currency,
  hideAvailableSlots = false,
  filter = "all",
}: FreeSlotsViewProps) {
  const t = useTranslations("creator_schedule");
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  const today = startOfDay(new Date());
  const isPastDay = isBefore(startOfDay(selectedDate), today);

  const timeline = buildTimeline(
    startTime,
    endTime,
    breaks,
    appointments,
    slotIntervalMinutes,
  );

  const handleBookSlot = (slotTime: string, durationMinutes: number) => {
    setSelectedSlot({
      startTime: slotTime,
      maxDurationMinutes: durationMinutes,
    });
    setQuickBookOpen(true);
  };

  if (!isConfigured) {
    return (
      <Paper className="flex items-center justify-center gap-3 p-4">
        <CalendarOff className="h-5 w-5 text-muted" />
        <p className="text-sm text-muted">{t("not_configured")}</p>
      </Paper>
    );
  }

  if (timeline.length === 0) {
    return (
      <Paper className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted">{t("no_slots")}</p>
      </Paper>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {timeline.map((item) => {
          // Hide free slots when filtering or when explicitly hidden
          const isFiltering = filter !== "all";
          if ((hideAvailableSlots || isFiltering) && item.type === "free") {
            return null;
          }

          if (item.type === "appointment") {
            // Filter appointments based on selected filter
            const isPending = item.data.status === "pending";
            if (filter === "confirmed" && isPending) {
              return null;
            }
            if (filter === "pending" && !isPending) {
              return null;
            }

            return (
              <AppointmentCard
                key={`apt-${item.data.id}`}
                appointment={item.data}
                nickname={nickname}
              />
            );
          }

          // Always show breaks
          if (item.type === "break") {
            return (
              <BreakCard key={`break-${item.data.id}`} breakItem={item.data} />
            );
          }

          if (isPastDay) {
            return (
              <PastEmptySlot
                key={`free-${item.startTime}`}
                startTime={item.startTime}
              />
            );
          }

          return (
            <AvailableSlot
              key={`free-${item.startTime}`}
              startTime={item.startTime}
              durationMinutes={item.durationMinutes}
              onBook={() =>
                handleBookSlot(item.startTime, item.durationMinutes)
              }
            />
          );
        })}
      </div>

      {selectedSlot && (
        <QuickBookingDialog
          open={quickBookOpen}
          onOpenChange={setQuickBookOpen}
          beautyPageId={beautyPageId}
          nickname={nickname}
          date={selectedDate}
          slot={selectedSlot}
          serviceGroups={serviceGroups}
          clients={clients}
          currency={currency}
        />
      )}
    </>
  );
}
