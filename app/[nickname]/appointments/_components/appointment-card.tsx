"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Paper } from "@/lib/ui/paper";
import { cn } from "@/lib/utils/cn";
import type { Appointment } from "../_lib/types";

const appointmentCardVariants = cva("transition-colors", {
  variants: {
    variant: {
      queue: "p-4",
      compact: "p-3",
    },
  },
  defaultVariants: {
    variant: "queue",
  },
});

interface AppointmentCardProps
  extends VariantProps<typeof appointmentCardVariants> {
  appointment: Appointment;
  nickname: string;
  isCompleted?: boolean;
  className?: string;
  /** Callback to confirm a pending appointment */
  onConfirm?: (id: string) => void;
  /** Callback to decline a pending appointment */
  onDecline?: (id: string) => void;
  /** Loading states */
  isConfirming?: boolean;
  isDeclining?: boolean;
}

/**
 * Appointment card for the queue view
 *
 * Variants:
 * - queue: Standard card with time, avatar, name, service, chevron
 * - compact: Smaller card used in completed section
 *
 * Features:
 * - Pending appointments have dashed border (not finalized)
 * - Completed appointments have reduced opacity
 * - All cards link to detail page
 */
export function AppointmentCard({
  appointment,
  nickname,
  isCompleted = false,
  variant = "queue",
  className,
  onConfirm,
  onDecline,
  isConfirming = false,
  isDeclining = false,
}: AppointmentCardProps) {
  const startTime = appointment.start_time.slice(0, 5);
  const detailsHref = `/${nickname}/appointments/${appointment.id}`;
  const isPending = appointment.status === "pending";
  const isLoading = isConfirming || isDeclining;

  // Inner card content
  const innerCard = (
    <Paper
      className={cn(
        appointmentCardVariants({ variant }),
        isCompleted && "opacity-60",
        "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Time */}
        <span className="w-12 shrink-0 text-lg font-semibold text-foreground">
          {startTime}
        </span>

        {/* Avatar */}
        <Avatar name={appointment.client_name} size="sm" />

        {/* Client name and service */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">
            {appointment.client_name}
          </p>
          <p className="truncate text-sm text-muted">
            {appointment.service_name}
          </p>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </div>
    </Paper>
  );

  // For pending appointments: notification-style "wants to book" card
  if (isPending) {
    const price = `${(appointment.service_price_cents / 100).toFixed(0)} ${appointment.service_currency}`;

    return (
      <Link
        href={detailsHref}
        className={cn("block w-full text-left", className)}
      >
        <Paper className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          {/* Avatar + Message + Chevron */}
          <div className="flex gap-3">
            <div className="shrink-0">
              <Avatar name={appointment.client_name} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              {/* "Name wants to book Service at Time" message */}
              <p className="text-foreground">
                <span className="font-semibold">{appointment.client_name}</span>
                <span className="text-muted"> wants to book </span>
                <span className="font-medium">{appointment.service_name}</span>
                <span className="text-muted"> at </span>
                <span className="font-medium">{startTime}</span>
              </p>
              {/* Price */}
              <p className="mt-1 text-sm text-muted">{price}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm?.(appointment.id);
              }}
              disabled={isLoading}
            >
              {isConfirming ? "Confirming..." : "Confirm"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDecline?.(appointment.id);
              }}
              disabled={isLoading}
            >
              {isDeclining ? "Declining..." : "Decline"}
            </Button>
          </div>
        </Paper>
      </Link>
    );
  }

  // Standard card: just a link
  return (
    <Link
      href={detailsHref}
      className={cn("block w-full text-left", className)}
    >
      {innerCard}
    </Link>
  );
}
