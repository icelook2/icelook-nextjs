"use client";

import {
  CalendarCheck,
  CalendarX2,
  CheckCircle2,
  Clock,
  UserX,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { Avatar } from "@/lib/ui/avatar";
import { Paper } from "@/lib/ui/paper";
import type { Appointment } from "../_lib/types";
import { calculateDurationMinutes } from "../_lib/workday-utils";

interface DayCompleteSummaryProps {
  completedAppointments: Appointment[];
  cancelledCount: number;
  noShowCount: number;
  totalEarningsCents: number;
  currency: string;
}

/**
 * Celebratory summary card shown when all appointments are completed
 * Displays client avatars and comprehensive day statistics
 */
export function DayCompleteSummary({
  completedAppointments,
  cancelledCount,
  noShowCount,
  totalEarningsCents,
  currency,
}: DayCompleteSummaryProps) {
  // Calculate stats
  const stats = useMemo(() => {
    if (completedAppointments.length === 0) {
      return null;
    }

    // Sort by start time to get first and last
    const sorted = [...completedAppointments].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );

    const firstStart = sorted[0].start_time.slice(0, 5);
    const lastEnd = sorted[sorted.length - 1].end_time.slice(0, 5);

    // Calculate total work time (sum of all appointment durations)
    const totalMinutes = completedAppointments.reduce((sum, apt) => {
      return sum + calculateDurationMinutes(apt.start_time, apt.end_time);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const workTimeFormatted =
      hours > 0
        ? minutes > 0
          ? `${hours}h ${minutes}m`
          : `${hours}h`
        : `${minutes}m`;

    // Get unique clients (by name, since we might not have client_id)
    const uniqueClients = Array.from(
      new Map(
        completedAppointments.map((apt) => [apt.client_name, apt]),
      ).values(),
    );

    return {
      appointmentCount: completedAppointments.length,
      clientCount: uniqueClients.length,
      clients: uniqueClients.slice(0, 8), // Max 8 avatars
      totalMinutes,
      workTimeFormatted,
      timeSpan: `${firstStart} – ${lastEnd}`,
    };
  }, [completedAppointments]);

  if (!stats) {
    return null;
  }

  const formattedEarnings = (totalEarningsCents / 100).toLocaleString();

  return (
    <Paper className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">All done!</p>
          <p className="text-sm text-muted">Your day is complete</p>
        </div>
      </div>

      {/* Client avatars */}
      <div className="border-b border-border px-4 py-4">
        <div className="mb-2 flex items-center justify-center -space-x-2">
          {stats.clients.map((apt, index) => (
            <div
              key={apt.id}
              className="relative rounded-full ring-2 ring-surface"
              style={{ zIndex: stats.clients.length - index }}
            >
              <Avatar name={apt.client_name} size="md" />
            </div>
          ))}
          {completedAppointments.length > 8 && (
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-xs font-medium text-muted ring-2 ring-surface">
              +{completedAppointments.length - 8}
            </div>
          )}
        </div>
        <p className="text-center text-sm text-muted">
          Served {stats.clientCount} client{stats.clientCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats list */}
      <div className="divide-y divide-border">
        <StatRow
          icon={<Wallet className="h-5 w-5" />}
          label="Earned"
          value={`${formattedEarnings} ${currency}`}
          iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
        <StatRow
          icon={<Clock className="h-5 w-5" />}
          label="Time worked"
          value={stats.workTimeFormatted}
          sublabel={stats.timeSpan}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
        />
        <StatRow
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Completed"
          value={`${stats.appointmentCount} appointment${stats.appointmentCount !== 1 ? "s" : ""}`}
          iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
        {cancelledCount > 0 && (
          <StatRow
            icon={<CalendarX2 className="h-5 w-5" />}
            label="Cancelled"
            value={`${cancelledCount} appointment${cancelledCount !== 1 ? "s" : ""}`}
            iconClassName="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
          />
        )}
        {noShowCount > 0 && (
          <StatRow
            icon={<UserX className="h-5 w-5" />}
            label="No-show"
            value={`${noShowCount} appointment${noShowCount !== 1 ? "s" : ""}`}
            iconClassName="bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"
          />
        )}
      </div>
    </Paper>
  );
}

function StatRow({
  icon,
  label,
  value,
  sublabel,
  iconClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
      {sublabel && <span className="text-sm text-muted">{sublabel}</span>}
    </div>
  );
}
