"use client";

import { isFuture as checkIsFuture, isToday as checkIsToday } from "date-fns";
import { CalendarOff, CalendarX2, CheckCircle2, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Paper } from "@/lib/ui/paper";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { SettingsItem } from "@/lib/ui/settings-item";
import {
  cancelAppointment,
  confirmAppointment,
} from "../_actions/appointment.actions";
import { toDateString } from "../_lib/date-utils";
import type { Appointment } from "../_lib/types";
import {
  getAppointmentsForDate,
  getBreakMinutes,
  getCompletedAppointments,
  getCurrentAppointment,
  getUpcomingAppointments,
} from "../_lib/workday-utils";
import { AppointmentCard } from "./appointment-card";
import { BreakIndicator } from "./break-indicator";
// import { DayCompleteSummary } from "./day-complete-summary";
import { DayStatsHeader } from "./day-stats-header";
import { StatusBanner } from "./status-banner";

interface ScheduleViewProps {
  beautyPageId: string;
  nickname: string;
  appointments: Appointment[];
  selectedDate: Date;
  dayStats: {
    appointmentCount: number;
    totalEarningsCents: number;
    currency: string;
  };
}

/**
 * Main schedule view component
 *
 * Orchestrates all sub-components:
 * - DayStatsHeader: Date navigation + earnings
 * - StatusBanner: Current state (free/active/completed/etc.)
 * - Upcoming queue with break indicators
 * - CompletedSection: Collapsible completed appointments
 */
export function ScheduleView({
  beautyPageId,
  nickname,
  appointments,
  selectedDate,
  dayStats,
}: ScheduleViewProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const isToday = checkIsToday(selectedDate);
  const isFuture = checkIsFuture(selectedDate);
  const dateStr = toDateString(selectedDate);

  // Update current time every second (only when viewing today)
  useEffect(() => {
    if (!isToday) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isToday]);

  // Get appointments for selected date
  const dayAppointments = useMemo(
    () => getAppointmentsForDate(appointments, dateStr),
    [appointments, dateStr],
  );

  // Get current, upcoming, and completed appointments
  const currentAppointment = useMemo(() => {
    if (!isToday) {
      return null;
    }
    return getCurrentAppointment(dayAppointments, currentTime);
  }, [dayAppointments, currentTime, isToday]);

  const upcomingAppointments = useMemo(() => {
    if (!isToday) {
      // For non-today dates, show all non-completed appointments
      return dayAppointments.filter(
        (apt) =>
          apt.status !== "completed" &&
          apt.status !== "cancelled" &&
          apt.status !== "no_show",
      );
    }
    return getUpcomingAppointments(dayAppointments, currentTime);
  }, [dayAppointments, currentTime, isToday]);

  const completedAppointments = useMemo(() => {
    if (!isToday) {
      return dayAppointments.filter((apt) => apt.status === "completed");
    }
    return getCompletedAppointments(dayAppointments, currentTime);
  }, [dayAppointments, currentTime, isToday]);

  const cancelledAppointments = useMemo(
    () => dayAppointments.filter((apt) => apt.status === "cancelled"),
    [dayAppointments],
  );

  const noShowAppointments = useMemo(
    () => dayAppointments.filter((apt) => apt.status === "no_show"),
    [dayAppointments],
  );

  // Helper to format appointment count text
  const formatCount = (count: number) =>
    `${count} appointment${count !== 1 ? "s" : ""}`;

  // Determine banner state
  const bannerState = useMemo(() => {
    if (!isToday) {
      return null; // No banner for non-today dates
    }

    if (currentAppointment) {
      return "active" as const;
    }

    // Check if we're before the first appointment
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    const firstUpcoming = upcomingAppointments[0];
    if (firstUpcoming) {
      const [hours, minutes] = firstUpcoming.start_time.split(":").map(Number);
      const firstStartMinutes = hours * 60 + minutes;

      // If current time is significantly before first appointment (more than break away)
      // and it's still morning, show "day not started"
      if (now < firstStartMinutes && currentTime.getHours() < 12) {
        return "day_not_started" as const;
      }
    }

    // Check if all appointments are completed
    if (
      completedAppointments.length > 0 &&
      upcomingAppointments.length === 0 &&
      !currentAppointment
    ) {
      return "day_complete" as const;
    }

    // Default: free time
    return "free_time" as const;
  }, [
    isToday,
    currentAppointment,
    upcomingAppointments,
    completedAppointments,
    currentTime,
  ]);

  // Action handlers
  const handleApprove = useCallback(
    async (appointmentId: string) => {
      setApprovingId(appointmentId);
      try {
        const result = await confirmAppointment({
          appointmentId,
          beautyPageId,
          nickname,
        });
        if (result.success) {
          router.refresh();
        }
      } finally {
        setApprovingId(null);
      }
    },
    [beautyPageId, nickname, router],
  );

  const handleDecline = useCallback(
    async (appointmentId: string) => {
      setDecliningId(appointmentId);
      try {
        const result = await cancelAppointment({
          appointmentId,
          beautyPageId,
          nickname,
        });
        if (result.success) {
          router.refresh();
        }
      } finally {
        setDecliningId(null);
      }
    },
    [beautyPageId, nickname, router],
  );

  // For non-today dates, show simple list view
  const isPast = !isToday && !isFuture;

  if (!isToday) {
    // For past days, show completed appointments directly
    // For future days, show upcoming (scheduled) appointments
    const appointmentsToShow = isPast
      ? completedAppointments
      : upcomingAppointments;
    const sectionTitle = isPast ? "Completed" : "Appointments";
    const emptyMessage = isPast
      ? "No completed appointments"
      : "No appointments on this day";

    return (
      <div className="space-y-6">
        <DayStatsHeader
          currentDate={selectedDate}
          appointmentCount={dayStats.appointmentCount}
          totalEarningsCents={dayStats.totalEarningsCents}
          currency={dayStats.currency}
          hideStats
        />

        <section>
          <h2 className="mb-3 text-base font-semibold">
            {sectionTitle} ({appointmentsToShow.length})
          </h2>

          {appointmentsToShow.length > 0 ? (
            <div className="space-y-2">
              {appointmentsToShow.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  nickname={nickname}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                  isApproving={approvingId === apt.id}
                  isDeclining={decliningId === apt.id}
                />
              ))}
            </div>
          ) : (
            <Paper className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarOff className="mb-2 h-6 w-6 text-muted" />
              <p className="text-sm text-muted">{emptyMessage}</p>
            </Paper>
          )}
        </section>

        {/* Other section - Cancelled and No-show for past, only Cancelled for future */}
        <SettingsGroup title="Other">
          <SettingsItem
            href={`/${nickname}/appointments/cancelled`}
            icon={CalendarX2}
            title="Cancelled"
            value={formatCount(cancelledAppointments.length)}
            iconClassName="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
            variant="grouped"
            noBorder={isFuture}
          />
          {isPast && (
            <SettingsItem
              href={`/${nickname}/appointments/no-show`}
              icon={UserX}
              title="No-show"
              value={formatCount(noShowAppointments.length)}
              iconClassName="bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
              variant="grouped"
              noBorder
            />
          )}
        </SettingsGroup>
      </div>
    );
  }

  // Today's view with full features
  return (
    <div className="space-y-6">
      {/* Header with stats - hide stats when day is complete */}
      <DayStatsHeader
        currentDate={selectedDate}
        appointmentCount={dayStats.appointmentCount}
        totalEarningsCents={dayStats.totalEarningsCents}
        currency={dayStats.currency}
        hideStats={bannerState === "day_complete"}
      />

      {/* Status banner - only for active day states (not day_complete) */}
      {bannerState && bannerState !== "day_complete" && (
        <StatusBanner
          state={bannerState}
          currentAppointment={currentAppointment}
          nextAppointment={upcomingAppointments[0] ?? null}
          currentTime={currentTime}
          nickname={nickname}
          completedCount={completedAppointments.length}
        />
      )}

      {/* Day complete summary - kept for future use
      {bannerState === "day_complete" && completedAppointments.length > 0 && (
        <DayCompleteSummary
          completedAppointments={completedAppointments}
          cancelledCount={cancelledAppointments.length}
          noShowCount={noShowAppointments.length}
          totalEarningsCents={dayStats.totalEarningsCents}
          currency={dayStats.currency}
        />
      )}
      */}

      {/* Completed appointments section - shown when day is complete */}
      {bannerState === "day_complete" && (
        <section>
          <h2 className="mb-3 text-base font-semibold">
            Completed ({completedAppointments.length})
          </h2>

          {completedAppointments.length > 0 ? (
            <div className="space-y-2">
              {completedAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  nickname={nickname}
                />
              ))}
            </div>
          ) : (
            <Paper className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarOff className="mb-2 h-6 w-6 text-muted" />
              <p className="text-sm text-muted">No completed appointments</p>
            </Paper>
          )}
        </section>
      )}

      {/* Upcoming appointments with break indicators */}
      {upcomingAppointments.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">
            Upcoming ({upcomingAppointments.length})
          </h2>

          <div className="space-y-1">
            {upcomingAppointments.map((apt, index) => {
              // Calculate break from previous appointment or current time
              let breakMinutes = 0;
              if (index === 0) {
                // First upcoming: calculate break from current appointment end or now
                if (currentAppointment) {
                  breakMinutes = getBreakMinutes(
                    currentAppointment.end_time,
                    apt.start_time,
                  );
                }
                // If no current appointment, break was already shown in status banner
              } else {
                // Break from previous appointment
                const prevApt = upcomingAppointments[index - 1];
                breakMinutes = getBreakMinutes(
                  prevApt.end_time,
                  apt.start_time,
                );
              }

              return (
                <div key={apt.id}>
                  {/* Show break indicator (skip for first if status banner shows it) */}
                  {index > 0 && breakMinutes > 5 && (
                    <BreakIndicator durationMinutes={breakMinutes} />
                  )}

                  <AppointmentCard
                    appointment={apt}
                    nickname={nickname}
                    onApprove={handleApprove}
                    onDecline={handleDecline}
                    isApproving={approvingId === apt.id}
                    isDeclining={decliningId === apt.id}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Other section */}
      <SettingsGroup title="Other">
        {/* Completed - only show when day is active (not complete) */}
        {bannerState !== "day_complete" && (
          <SettingsItem
            href={`/${nickname}/appointments/completed`}
            icon={CheckCircle2}
            title="Completed"
            value={formatCount(completedAppointments.length)}
            iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
            variant="grouped"
          />
        )}
        <SettingsItem
          href={`/${nickname}/appointments/cancelled`}
          icon={CalendarX2}
          title="Cancelled"
          value={formatCount(cancelledAppointments.length)}
          iconClassName="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
          variant="grouped"
        />
        <SettingsItem
          href={`/${nickname}/appointments/no-show`}
          icon={UserX}
          title="No-show"
          value={formatCount(noShowAppointments.length)}
          iconClassName="bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
          variant="grouped"
          noBorder
        />
      </SettingsGroup>

      {/* Empty state when no appointments at all */}
      {dayAppointments.length === 0 && (
        <Paper className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarOff className="mb-2 h-6 w-6 text-muted" />
          <p className="text-sm text-muted">No appointments today</p>
        </Paper>
      )}
    </div>
  );
}
