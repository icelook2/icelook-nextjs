"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronRight, X } from "lucide-react";
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
  // Action callbacks for pending appointments
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  isApproving?: boolean;
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
 * - Pending appointments get orange wrap with Approve/Decline buttons
 * - Completed appointments have reduced opacity
 * - All cards link to detail page
 */
export function AppointmentCard({
  appointment,
  nickname,
  isCompleted = false,
  variant = "queue",
  className,
  onApprove,
  onDecline,
  isApproving = false,
  isDeclining = false,
}: AppointmentCardProps) {
  const startTime = appointment.start_time.slice(0, 5);
  const detailsHref = `/${nickname}/appointments/${appointment.id}`;
  const isPending = appointment.status === "pending";
  const isLoading = isApproving || isDeclining;

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

  // For pending appointments: wrap in attention-grabbing container with actions
  if (isPending) {
    return (
      <div
        className={cn(
          "rounded-2xl bg-orange-500/10 p-3",
          "dark:bg-orange-500/10",
          className,
        )}
      >
        {/* Badge label */}
        <span className="mb-2 block text-center text-xs font-semibold text-orange-500">
          New Appointment
        </span>

        {/* Inner card as link */}
        <Link href={detailsHref} className="block">
          {innerCard}
        </Link>

        {/* Action buttons outside the card */}
        <div className="mt-3 flex justify-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onApprove?.(appointment.id)}
            disabled={isLoading}
          >
            <Check className="mr-1.5 h-4 w-4" />
            {isApproving ? "Approving..." : "Approve"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDecline?.(appointment.id)}
            disabled={isLoading}
          >
            <X className="mr-1.5 h-4 w-4" />
            {isDeclining ? "Declining..." : "Decline"}
          </Button>
        </div>
      </div>
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
