"use client";

import { Calendar, Clock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";
import { formatDuration, formatPrice } from "../_lib/constants";
import type { CreateBeautyPageState } from "../_lib/types";
import { DotProgress } from "./dot-progress";

// Consistent gradients for logo preview based on name
const gradients = [
  "from-blue-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-indigo-500",
];

interface StepConfirmationProps {
  state: CreateBeautyPageState;
  totalSteps: number;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Confirmation step showing a preview of the beauty page before creation.
 */
export function StepConfirmation({
  state,
  totalSteps,
  onPrevious,
  onSubmit,
  isSubmitting,
}: StepConfirmationProps) {
  const t = useTranslations("create_beauty_page");

  const { name, nickname, services, selectedDates, weekdayHours } = state;

  const servicesCount = services.length;
  const daysCount = selectedDates.size;
  const hasHours = weekdayHours.size > 0;

  const initial = name.charAt(0).toUpperCase();
  const gradientIndex = name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  const hasMissingOptional = servicesCount === 0 || daysCount === 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Main content area - centered */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-28 pt-6">
        {/* Preview card */}
        <div className="mb-6">
          <div className="rounded-2xl border border-border bg-surface-secondary p-6">
            {/* Header with avatar and name */}
            <div className="mb-4 flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-xl font-bold text-white`}
              >
                {initial}
              </div>
              <div>
                <h3 className="font-semibold">{name}</h3>
                <p className="text-sm text-muted">icelook.app/@{nickname}</p>
              </div>
            </div>

            {/* Services summary */}
            <div className="mb-4 border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-muted" />
                {t("confirmation.services_label")}
              </div>
              {servicesCount > 0 ? (
                <ul className="space-y-1 text-sm">
                  {services.slice(0, 3).map((service) => (
                    <li key={service.id} className="flex justify-between">
                      <span className="text-muted">{service.name}</span>
                      <span>
                        {formatPrice(service.priceCents)} UAH •{" "}
                        {formatDuration(service.durationMinutes)}
                      </span>
                    </li>
                  ))}
                  {services.length > 3 && (
                    <li className="text-muted">
                      +{services.length - 3} more...
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  {t("confirmation.services_count", { count: 0 })}
                </p>
              )}
            </div>

            {/* Availability summary */}
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted" />
                {t("confirmation.availability_label")}
              </div>
              {daysCount > 0 ? (
                <div className="space-y-1 text-sm">
                  <p>
                    {t("confirmation.availability_count", { count: daysCount })}
                  </p>
                  {hasHours && (
                    <div className="flex items-center gap-1 text-muted">
                      <Clock className="h-3 w-3" />
                      {Array.from(weekdayHours.values())
                        .slice(0, 2)
                        .map((h, i) => (
                          <span key={h.weekday}>
                            {i > 0 && ", "}
                            {h.startTime}-{h.endTime}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  {t("confirmation.availability_count", { count: 0 })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dot progress */}
        <div className="mb-6 flex justify-center">
          <DotProgress currentStep={totalSteps} totalSteps={totalSteps} />
        </div>

        {/* Title + Subtitle */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">{t("confirmation.title")}</h1>
          <p className="mt-2 text-muted">{t("confirmation.subtitle")}</p>
        </div>

        {/* Missing items note */}
        {hasMissingOptional && (
          <p className="text-center text-sm text-muted">
            {t("confirmation.missing_note")}
          </p>
        )}
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={onPrevious}>
            {t("navigation.previous")}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {t("navigation.create")}
          </Button>
        </div>
      </div>
    </div>
  );
}
