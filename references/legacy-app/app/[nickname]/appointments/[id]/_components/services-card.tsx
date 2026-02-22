"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { removeServiceFromAppointment } from "@/app/[nickname]/appointments/_actions";
import type { Appointment } from "@/lib/queries/appointments";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { DiscountBadge } from "@/lib/ui/discount-badge";
import { Paper } from "@/lib/ui/paper";
import {
  calculateDiscountPercentage,
  parseAppointmentMetadata,
} from "@/lib/utils/appointment-metadata";
import { formatDuration } from "@/lib/utils/price-range";
import { AddServiceDialog } from "./add-service-dialog";

interface ServicesCardProps {
  appointment: Appointment;
  canModify: boolean;
  beautyPageId: string;
  nickname: string;
  serviceGroups: ServiceGroupWithServices[];
}

export function ServicesCard({
  appointment,
  canModify,
  beautyPageId,
  nickname,
  serviceGroups,
}: ServicesCardProps) {
  const t = useTranslations("appointment_details.services");
  const services = appointment.appointment_services;
  const [isPending, startTransition] = useTransition();

  const formatPrice = (cents: number) =>
    `${(cents / 100).toFixed(0)} ${appointment.service_currency}`;

  const handleRemoveService = (appointmentServiceId: string) => {
    startTransition(async () => {
      await removeServiceFromAppointment({
        appointmentId: appointment.id,
        beautyPageId,
        nickname,
        appointmentServiceId,
      });
    });
  };

  const canRemoveService = canModify && services.length > 1;

  // Parse metadata to check for bundle info
  const metadata = parseAppointmentMetadata(appointment.client_notes);
  const bundle = metadata?.bundle ?? null;
  const discountPercentage =
    bundle && metadata
      ? calculateDiscountPercentage(
          metadata.total_original_price_cents,
          metadata.total_final_price_cents,
        )
      : 0;

  return (
    <section className="space-y-3">
      {/* Section header */}
      <h2 className="text-base font-semibold">{t("title")}</h2>

      <Paper>
        {/* Bundle header if applicable */}
        {bundle && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{bundle.name}</span>
              <DiscountBadge percentage={discountPercentage} />
            </div>
          </div>
        )}

        {/* Service rows */}
        {services.map((service, index) => (
          <div
            key={service.id}
            className={`flex items-center justify-between px-4 py-3 ${
              index < services.length - 1 || canModify
                ? "border-b border-border"
                : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                {service.service_name}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {formatDuration(service.duration_minutes)}
                {/* Only show individual prices if NOT a bundle */}
                {!bundle && <> · {formatPrice(service.price_cents)}</>}
              </p>
            </div>

            {canRemoveService && (
              <button
                type="button"
                onClick={() => handleRemoveService(service.id)}
                disabled={isPending}
                className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-red-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                aria-label={t("remove_service")}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        ))}

        {/* Add Service button */}
        {canModify && (
          <AddServiceDialog
            appointment={appointment}
            beautyPageId={beautyPageId}
            nickname={nickname}
            serviceGroups={serviceGroups}
          />
        )}
      </Paper>
    </section>
  );
}
