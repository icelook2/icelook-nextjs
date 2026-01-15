"use client";

import {
  format,
  isBefore,
  isSameDay,
  startOfDay,
  addDays,
  subDays,
} from "date-fns";
import { CalendarOff, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import type { Appointment, WorkingDayBreak } from "../_lib/types";
import { AppointmentCard } from "./appointment-card";
import { BreakCard } from "./break-card";
import { AvailableSlot, PastEmptySlot } from "./free-slot-variants";
import {
  QuickBookingDialog,
  type SelectedSlot,
} from "./quick-booking";

interface FreeSlotsViewProps {
  /** The date being displayed */
  selectedDate: Date;
  /** Working day start time "HH:MM" */
  startTime: string;
  /** Working day end time "HH:MM" */
  endTime: string;
  /** Breaks during the working day */
  breaks: WorkingDayBreak[];
  /** Existing appointments */
  appointments: Appointment[];
  /** Nickname for links */
  nickname: string;
  /** Whether the working day is configured */
  isConfigured: boolean;
  /** Slot interval in minutes (default: 30) */
  slotIntervalMinutes?: number;
  /** Beauty page ID for booking */
  beautyPageId: string;
  /** Service groups for booking dialog */
  serviceGroups: ServiceGroupWithServices[];
  /** Recent clients for booking dialog */
  clients: BeautyPageClient[];
  /** Currency for price display */
  currency: string;
}

/** Timeline item types */
type TimelineItem =
  | { type: "appointment"; data: Appointment; startMinutes: number }
  | { type: "break"; data: WorkingDayBreak; startMinutes: number }
  | {
      type: "free";
      startTime: string;
      durationMinutes: number;
      startMinutes: number;
    };

/**
 * Format date with relative label for today/yesterday/tomorrow
 * e.g., "Today, January 15" or "Thursday, January 15"
 */
function formatDateWithRelative(date: Date): string {
  const today = startOfDay(new Date());
  const dateStart = startOfDay(date);

  if (isSameDay(dateStart, today)) {
    return `Today, ${format(date, "MMMM d")}`;
  }
  if (isSameDay(dateStart, subDays(today, 1))) {
    return `Yesterday, ${format(date, "MMMM d")}`;
  }
  if (isSameDay(dateStart, addDays(today, 1))) {
    return `Tomorrow, ${format(date, "MMMM d")}`;
  }

  return format(date, "EEEE, MMMM d");
}

/**
 * Convert "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to "HH:MM"
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Build a chronological timeline of appointments, breaks, and free slots
 */
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

  // Add appointments to timeline (exclude cancelled/no_show)
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

  // Add breaks to timeline
  for (const brk of breaks) {
    items.push({
      type: "break",
      data: brk,
      startMinutes: timeToMinutes(brk.start_time),
    });
  }

  // Collect all blocked time ranges
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

  // Generate free time slots
  for (
    let minutes = startMinutes;
    minutes < endMinutes;
    minutes += intervalMinutes
  ) {
    const slotStart = minutes;
    const slotEnd = minutes + intervalMinutes;

    // Check if this slot overlaps with any blocked range
    const isBlocked = blockedRanges.some(
      (range) => slotStart < range.end && slotEnd > range.start,
    );

    if (isBlocked) {
      continue;
    }

    // Calculate duration until next event
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

  // Sort all items by start time
  items.sort((a, b) => a.startMinutes - b.startMinutes);

  return items;
}

/**
 * Free slots view for the schedule
 *
 * Displays a chronological timeline of:
 * - Appointments (using AppointmentCard)
 * - Breaks (using BreakCard)
 * - Free slots (using FreeSlotCard)
 */
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
}: FreeSlotsViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Dialog state
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  // Determine if viewing a past day
  const today = startOfDay(new Date());
  const isPastDay = isBefore(startOfDay(selectedDate), today);

  // Build chronological timeline
  const timeline = buildTimeline(
    startTime,
    endTime,
    breaks,
    appointments,
    slotIntervalMinutes,
  );

  // Navigation helpers
  const createDateUrl = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(date, "yyyy-MM-dd"));
    return `${pathname}?${params.toString()}`;
  };

  const prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);

  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const handleBookSlot = (slotTime: string, durationMinutes: number) => {
    setSelectedSlot({
      startTime: slotTime,
      maxDurationMinutes: durationMinutes,
    });
    setQuickBookOpen(true);
  };

  // Not configured state
  if (!isConfigured) {
    return (
      <div className="space-y-6">
        {/* Date header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {formatDateWithRelative(selectedDate)}
          </h2>

          <div className="flex items-center gap-2">
            <Link href={createDateUrl(prevDate)}>
              <Button variant="secondary" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link href={createDateUrl(nextDate)}>
              <Button variant="secondary" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <Paper className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarOff className="mb-2 h-6 w-6 text-muted" />
          <p className="text-sm text-muted">Working day not configured</p>
        </Paper>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {formatDateWithRelative(selectedDate)}
          </h2>
          <p className="text-sm text-muted">
            {startTime.slice(0, 5)} – {endTime.slice(0, 5)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={createDateUrl(prevDate)}>
            <Button variant="secondary" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Link href={createDateUrl(nextDate)}>
            <Button variant="secondary" size="icon">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 ? (
        <div className="space-y-2">
          {timeline.map((item) => {
            if (item.type === "appointment") {
              return (
                <AppointmentCard
                  key={`apt-${item.data.id}`}
                  appointment={item.data}
                  nickname={nickname}
                />
              );
            }

            if (item.type === "break") {
              return (
                <BreakCard
                  key={`break-${item.data.id}`}
                  breakItem={item.data}
                />
              );
            }

            // Free slot - show different component for past vs future
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
                onBook={() => handleBookSlot(item.startTime, item.durationMinutes)}
              />
            );
          })}
        </div>
      ) : (
        <Paper className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted">No time slots available</p>
        </Paper>
      )}

      {/* Quick Booking Dialog */}
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
    </div>
  );
}
