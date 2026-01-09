"use client";

import { useState } from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Clock, Phone, Scissors, X } from "lucide-react";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { cn } from "@/lib/utils/cn";
import type { Appointment } from "../../settings/schedule/_lib/types";
import { formatDuration } from "@/lib/utils/price-range";
import { getAppointmentStatusColor } from "../../settings/schedule/_lib/schedule-utils";
import {
  calculateDurationMinutes,
  formatTimeRange,
  formatTimeRemaining,
  formatTimeUntil,
} from "../_lib/workday-utils";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";

const appointmentCardVariants = cva("transition-colors", {
  variants: {
    variant: {
      hero: "p-6",
      compact: "p-4",
      queue: "p-4",
    },
  },
  defaultVariants: {
    variant: "compact",
  },
});

interface AppointmentCardProps extends VariantProps<typeof appointmentCardVariants> {
  appointment: Appointment;
  currentTime: Date;
  nickname: string;
  isActive?: boolean;
  isCompleted?: boolean;
  showTimeUntil?: boolean;
  hideTime?: boolean;
  className?: string;
  // Action callbacks for queue variant
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  isApproving?: boolean;
  isDeclining?: boolean;
  isCancelling?: boolean;
}

export function AppointmentCard({
  appointment,
  currentTime,
  nickname,
  isActive = false,
  isCompleted = false,
  showTimeUntil = false,
  hideTime = false,
  variant = "compact",
  className,
  onApprove,
  onDecline,
  onReschedule,
  onCancel,
  isApproving = false,
  isDeclining = false,
  isCancelling = false,
}: AppointmentCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const statusColors = getAppointmentStatusColor(appointment.status);
  const startTime = appointment.start_time.slice(0, 5);

  const isHero = variant === "hero";
  const isQueue = variant === "queue";
  const isPending = appointment.status === "pending";

  // Queue variant: time-first layout
  if (isQueue) {
    const isLoading = isApproving || isDeclining || isCancelling;

    const cardContent = (
      <Paper
        className={cn(
          appointmentCardVariants({ variant }),
          isCompleted && "opacity-60",
          !isPending && "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
          className,
        )}
      >
          {/* Header: Time as main title + Status badge */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">
              {startTime}
            </h3>

            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                statusColors.bg,
                statusColors.text,
              )}
            >
              {appointment.status}
            </span>
          </div>

          {/* Client with avatar */}
          <div className="mt-3 flex items-center gap-2">
            <Avatar name={appointment.client_name} size="sm" />
            <p className="min-w-0 flex-1 truncate font-medium text-foreground">
              {appointment.client_name}
            </p>
          </div>

          {/* Action buttons - only for pending appointments */}
          {isPending && (
            <div className="mt-3 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.(appointment.id);
                }}
                disabled={isLoading}
              >
                <Check className="mr-1.5 h-4 w-4" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline?.(appointment.id);
                }}
                disabled={isLoading}
              >
                <X className="mr-1.5 h-4 w-4" />
                {isDeclining ? "Declining..." : "Decline"}
              </Button>
            </div>
          )}
        </Paper>
    );

    return (
      <>
        {isPending ? (
          cardContent
        ) : (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="w-full text-left"
          >
            {cardContent}
          </button>
        )}

        {/* Detail dialog for non-pending appointments */}
        {!isPending && (
          <AppointmentDetailDialog
            appointment={appointment}
            nickname={nickname}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onReschedule={onReschedule}
            onCancel={onCancel}
            isCancelling={isCancelling}
          />
        )}
      </>
    );
  }

  const cardContent = (
    <Paper
      className={cn(
        appointmentCardVariants({ variant }),
        isCompleted && "opacity-60",
        "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
        className,
      )}
    >
      {/* Header: Avatar + Name + Status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={appointment.client_name} size={isHero ? "md" : "sm"} />
          <h3
            className={cn(
              "truncate font-semibold text-foreground",
              isHero ? "text-xl" : "text-base",
            )}
          >
            {appointment.client_name}
          </h3>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            statusColors.bg,
            statusColors.text,
          )}
        >
          {appointment.status}
        </span>
      </div>

      {/* Service name (hero only) */}
      {isHero && (
        <div className="mt-3 flex items-center gap-2 text-muted">
          <Scissors className="h-4 w-4 shrink-0" />
          <span className="truncate text-base">{appointment.service_name}</span>
        </div>
      )}

      {/* Time info (unless hidden) */}
      {!hideTime && (
        <div className={cn("flex items-center gap-4", isHero ? "mt-3" : "mt-3")}>
          <div className="flex items-center gap-1.5 text-muted">
            <Clock className="h-4 w-4" />
            <span className={isHero ? "text-base" : "text-sm"}>
              {isHero
                ? `${formatTimeRange(appointment.start_time, appointment.end_time)} (${formatDuration(calculateDurationMinutes(appointment.start_time, appointment.end_time))})`
                : startTime}
            </span>
          </div>

          {isActive && (
            <span className="text-sm font-medium text-accent">
              {formatTimeRemaining(appointment.end_time, currentTime)}
            </span>
          )}

          {showTimeUntil && !isActive && (
            <span className="text-sm text-muted">
              {formatTimeUntil(appointment.start_time, currentTime)}
            </span>
          )}
        </div>
      )}

      {/* Contact info (hero only) */}
      {isHero && appointment.client_phone && (
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

      {/* Price (hero only) */}
      {isHero && (
        <div className="mt-3 text-right">
          <span className="text-lg font-semibold text-foreground">
            {(appointment.service_price_cents / 100).toFixed(0)} {appointment.service_currency}
          </span>
        </div>
      )}
    </Paper>
  );

  // Hero variant: navigate to details page
  if (isHero) {
    return (
      <Link
        href={`/${nickname}/workday/appointment/${appointment.id}`}
        className="block w-full text-left"
      >
        {cardContent}
      </Link>
    );
  }

  // Compact variant: open dialog
  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="w-full text-left"
      >
        {cardContent}
      </button>

      <AppointmentDetailDialog
        appointment={appointment}
        nickname={nickname}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onReschedule={onReschedule}
        onCancel={onCancel}
        isCancelling={isCancelling}
      />
    </>
  );
}
