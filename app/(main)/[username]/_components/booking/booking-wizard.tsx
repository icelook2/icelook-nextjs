"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useBooking } from "@/lib/appointments";
import { Dialog } from "@/lib/ui/dialog";
import { BookingStepConfirm } from "./booking-step-confirm";
import { BookingStepDateTime } from "./booking-step-datetime";
import { BookingStepGuestInfo } from "./booking-step-guest-info";

interface BookingWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingWizard({ onClose, onSuccess }: BookingWizardProps) {
  const t = useTranslations("booking");
  const { step, services, isAuthenticated } = useBooking();

  // For authenticated users, guest-info step is skipped
  const visibleSteps = isAuthenticated
    ? ["datetime", "confirmation"]
    : ["datetime", "guest-info", "confirmation"];
  const visibleStepIndex = visibleSteps.indexOf(step);

  return (
    <div className="flex flex-col h-[min(600px,80vh)]">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("title")}
          </h2>
          <p className="text-sm text-foreground/60">
            {services.length === 1
              ? services[0].name
              : t("services_count", { count: services.length })}
          </p>
        </div>
        <Dialog.Close
          onClick={onClose}
          className="text-foreground/40 hover:text-foreground transition-colors p-1 -mr-1 rounded-lg hover:bg-foreground/5"
        >
          <X className="h-5 w-5" />
        </Dialog.Close>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-3 border-b border-foreground/10 shrink-0">
        <div className="flex items-center gap-2">
          {visibleSteps.map((s, index) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                  index <= visibleStepIndex
                    ? "bg-violet-500 text-white"
                    : "bg-foreground/10 text-foreground/50"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  index === visibleStepIndex
                    ? "text-foreground font-medium"
                    : "text-foreground/50"
                }`}
              >
                {s === "datetime" && t("step_datetime")}
                {s === "guest-info" && t("step_guest_info")}
                {s === "confirmation" && t("step_confirmation")}
              </span>
              {index < visibleSteps.length - 1 && (
                <div className="w-8 h-px bg-foreground/10 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content with Step Animation */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {step === "datetime" && <BookingStepDateTime />}
            {step === "guest-info" && <BookingStepGuestInfo />}
            {step === "confirmation" && (
              <BookingStepConfirm onClose={onClose} onSuccess={onSuccess} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
