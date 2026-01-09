"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Clock, Phone, X } from "lucide-react";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { cn } from "@/lib/utils/cn";
import type { Appointment } from "../../settings/schedule/_lib/types";
import { getAppointmentStatusColor } from "../../settings/schedule/_lib/schedule-utils";
import { formatTimeRange } from "../_lib/workday-utils";

interface AppointmentDetailDialogProps {
  appointment: Appointment;
  nickname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Actions
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}

export function AppointmentDetailDialog({
  appointment,
  nickname,
  open,
  onOpenChange,
  onReschedule,
  onCancel,
  isCancelling = false,
}: AppointmentDetailDialogProps) {
  const statusColors = getAppointmentStatusColor(appointment.status);
  const timeRange = formatTimeRange(appointment.start_time, appointment.end_time);
  const canModify = appointment.status === "confirmed" || appointment.status === "pending";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          Appointment Details
        </Dialog.Header>

        <Dialog.Body className="space-y-6">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Status</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                statusColors.bg,
                statusColors.text,
              )}
            >
              {appointment.status}
            </span>
          </div>

          {/* Client info */}
          <div className="flex items-center gap-3">
            <Avatar name={appointment.client_name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                {appointment.client_name}
              </p>
              {appointment.client_phone && (
                <a
                  href={`tel:${appointment.client_phone}`}
                  className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {appointment.client_phone}
                </a>
              )}
            </div>
          </div>

          {/* Service & Time */}
          <div className="space-y-3 rounded-lg bg-surface-alt p-4">
            <div>
              <p className="text-sm text-muted">Service</p>
              <p className="font-medium">{appointment.service_name}</p>
            </div>

            <div className="flex items-center gap-1.5 text-muted">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{timeRange}</span>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted">Price</span>
              <span className="font-semibold">
                {(appointment.service_price_cents / 100).toFixed(0)} {appointment.service_currency}
              </span>
            </div>
          </div>

          {/* Notes if any */}
          {appointment.client_notes && (
            <div>
              <p className="mb-1 text-sm text-muted">Notes</p>
              <p className="text-sm">{appointment.client_notes}</p>
            </div>
          )}

          {/* View full details link */}
          <Link
            href={`/${nickname}/workday/appointment/${appointment.id}`}
            className="flex items-center justify-center gap-1 text-sm text-accent transition-colors hover:text-accent/80"
            onClick={() => onOpenChange(false)}
          >
            View full details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Dialog.Body>

        {/* Actions */}
        {canModify && (onReschedule || onCancel) && (
          <Dialog.Footer className="flex-col gap-2 sm:flex-row">
            {onReschedule && (
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  onReschedule(appointment.id);
                  onOpenChange(false);
                }}
              >
                <Calendar className="mr-1.5 h-4 w-4" />
                Reschedule
              </Button>
            )}
            {onCancel && (
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive sm:w-auto"
                onClick={() => onCancel(appointment.id)}
                disabled={isCancelling}
              >
                <X className="mr-1.5 h-4 w-4" />
                {isCancelling ? "Cancelling..." : "Cancel Appointment"}
              </Button>
            )}
          </Dialog.Footer>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
