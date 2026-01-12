"use client";

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  Phone,
  Scissors,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/lib/ui/avatar";
import { Paper } from "@/lib/ui/paper";
import { formatDuration } from "@/lib/utils/price-range";
import type { Appointment } from "../_lib/types";
import {
  calculateDurationMinutes,
  formatBreakDuration,
  formatTimeRange,
  formatTimeRemaining,
  getBreakMinutes,
} from "../_lib/workday-utils";

type BannerState = "free_time" | "active" | "day_not_started" | "day_complete";

interface StatusBannerProps {
  state: BannerState;
  currentAppointment: Appointment | null;
  nextAppointment: Appointment | null;
  currentTime: Date;
  nickname: string;
  completedCount: number;
}

/**
 * Adaptive status banner that changes based on current state
 *
 * States:
 * - free_time: Compact banner showing "Free until X · Next: Y"
 * - active: Hero card with countdown and navigation to details
 * - day_not_started: "First appointment at X · Name"
 * - day_complete: "All done! X appointments completed"
 */
export function StatusBanner({
  state,
  currentAppointment,
  nextAppointment,
  currentTime,
  nickname,
  completedCount,
}: StatusBannerProps) {
  switch (state) {
    case "free_time":
      return (
        <FreeTimeBanner
          nextAppointment={nextAppointment}
          currentTime={currentTime}
        />
      );

    case "active":
      return (
        <ActiveAppointmentCard
          appointment={currentAppointment!}
          currentTime={currentTime}
          nickname={nickname}
        />
      );

    case "day_not_started":
      return <DayNotStartedBanner firstAppointment={nextAppointment} />;

    case "day_complete":
      return <DayCompleteBanner completedCount={completedCount} />;

    default:
      return null;
  }
}

/**
 * Compact banner shown when specialist is free between appointments
 */
function FreeTimeBanner({
  nextAppointment,
  currentTime,
}: {
  nextAppointment: Appointment | null;
  currentTime: Date;
}) {
  if (!nextAppointment) {
    return (
      <Paper className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt">
          <Coffee className="h-5 w-5 text-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">Free time</p>
          <p className="text-sm text-muted">No more appointments today</p>
        </div>
      </Paper>
    );
  }

  // Calculate time until next appointment
  const currentTimeStr = `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;
  const breakMinutes = getBreakMinutes(
    currentTimeStr,
    nextAppointment.start_time,
  );
  const breakText = formatBreakDuration(breakMinutes);

  return (
    <Paper className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt">
        <Coffee className="h-5 w-5 text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">
          Free until {nextAppointment.start_time.slice(0, 5)}
          {breakText && (
            <span className="text-muted">
              {" "}
              ({breakText.replace(" break", "")})
            </span>
          )}
        </p>
        <p className="truncate text-sm text-muted">
          Next: {nextAppointment.client_name} · {nextAppointment.service_name}
        </p>
      </div>
    </Paper>
  );
}

/**
 * Hero card shown when there's an active appointment in progress
 */
function ActiveAppointmentCard({
  appointment,
  currentTime,
  nickname,
}: {
  appointment: Appointment;
  currentTime: Date;
  nickname: string;
}) {
  const detailsHref = `/${nickname}/appointments/${appointment.id}`;
  const timeRemaining = formatTimeRemaining(appointment.end_time, currentTime);
  const durationMinutes = calculateDurationMinutes(
    appointment.start_time,
    appointment.end_time,
  );

  return (
    <Link href={detailsHref} className="block">
      <Paper className="p-6 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        {/* Header: Avatar + Name + Chevron */}
        <div className="flex items-center gap-3">
          <Avatar name={appointment.client_name} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-semibold text-foreground">
              {appointment.client_name}
            </h3>
            <span className="text-sm font-medium text-accent">
              {timeRemaining}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
        </div>

        {/* Service name */}
        <div className="mt-3 flex items-center gap-2 text-muted">
          <Scissors className="h-4 w-4 shrink-0" />
          <span className="truncate text-base">{appointment.service_name}</span>
        </div>

        {/* Time info */}
        <div className="mt-3 flex items-center gap-1.5 text-muted">
          <Clock className="h-4 w-4" />
          <span className="text-base">
            {formatTimeRange(appointment.start_time, appointment.end_time)} (
            {formatDuration(durationMinutes)})
          </span>
        </div>

        {/* Contact info */}
        {appointment.client_phone && (
          <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `tel:${appointment.client_phone}`;
              }}
              className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <Phone className="h-4 w-4" />
              {appointment.client_phone}
            </button>
          </div>
        )}

        {/* Price */}
        <div className="mt-3 text-right">
          <span className="text-lg font-semibold text-foreground">
            {(appointment.service_price_cents / 100).toFixed(0)}{" "}
            {appointment.service_currency}
          </span>
        </div>
      </Paper>
    </Link>
  );
}

/**
 * Banner shown when viewing today but before first appointment
 */
function DayNotStartedBanner({
  firstAppointment,
}: {
  firstAppointment: Appointment | null;
}) {
  if (!firstAppointment) {
    return (
      <Paper className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt">
          <Sun className="h-5 w-5 text-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">Good morning!</p>
          <p className="text-sm text-muted">No appointments scheduled today</p>
        </div>
      </Paper>
    );
  }

  return (
    <Paper className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt">
        <Sun className="h-5 w-5 text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">
          First appointment at {firstAppointment.start_time.slice(0, 5)}
        </p>
        <p className="truncate text-sm text-muted">
          {firstAppointment.client_name} · {firstAppointment.service_name}
        </p>
      </div>
    </Paper>
  );
}

/**
 * Banner shown when all appointments for the day are completed
 */
function DayCompleteBanner({ completedCount }: { completedCount: number }) {
  return (
    <Paper className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">All done!</p>
        <p className="text-sm text-muted">
          {completedCount} appointment{completedCount !== 1 ? "s" : ""}{" "}
          completed today
        </p>
      </div>
    </Paper>
  );
}
