"use client";

import { Calendar, Check, Clock, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  formatDateForDisplay,
  formatDuration,
  formatPrice,
  formatTimeForDisplay,
  useBooking,
} from "@/lib/appointments";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Textarea } from "@/lib/ui/textarea";
import { createMultiServiceAppointment } from "../../_actions/booking.action";

interface BookingStepConfirmProps {
  onClose: () => void;
  onSuccess: () => void;
}

type BookingState = "review" | "submitting" | "success" | "error";

export function BookingStepConfirm({
  onClose,
  onSuccess,
}: BookingStepConfirmProps) {
  const t = useTranslations("booking");
  const {
    specialist,
    services,
    totals,
    formData,
    isAuthenticated,
    userName,
    setClientNotes,
    goBack,
  } = useBooking();

  const [bookingState, setBookingState] = useState<BookingState>("review");
  const [, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState(formData.clientNotes);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setClientNotes(e.target.value);
  };

  const handleConfirm = () => {
    const { date, timeSlot } = formData;
    if (!date || !timeSlot) {
      return;
    }

    setBookingState("submitting");
    setErrorMessage(null);

    startTransition(async () => {
      const result = await createMultiServiceAppointment({
        specialist_id: specialist.id,
        service_ids: services.map((s) => s.id),
        date,
        start_time: timeSlot.start,
        client_notes: notes || undefined,
        guest_name: formData.guestName || undefined,
        guest_phone: formData.guestPhone || undefined,
      });

      if (result.success) {
        setBookingState("success");
        onSuccess();
      } else {
        setBookingState("error");
        setErrorMessage(result.error);
      }
    });
  };

  // Success State
  if (bookingState === "success") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
          >
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </motion.div>

          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t("success_title")}
          </h3>
          <p className="text-foreground/60 mb-6">{t("success_message")}</p>

          <div className="bg-foreground/5 rounded-xl p-4 w-full max-w-sm text-left">
            <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
              <Calendar className="h-4 w-4" />
              <span>
                {formData.date && formatDateForDisplay(formData.date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Clock className="h-4 w-4" />
              <span>
                {formData.timeSlot &&
                  `${formatTimeForDisplay(formData.timeSlot.start)} - ${formatTimeForDisplay(formData.timeSlot.end)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-foreground/10 px-6 py-4 shrink-0">
          <Button onClick={onClose} className="w-full">
            {t("done")}
          </Button>
        </div>
      </div>
    );
  }

  // Review State (default)
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Booking Summary */}
        <div>
          <h3 className="text-sm font-medium text-foreground/70 mb-3">
            {t("booking_summary")}
          </h3>
          <div className="bg-foreground/5 rounded-xl p-4 space-y-3">
            {/* Services */}
            <div>
              <p className="text-sm text-foreground/60 mb-2">
                {services.length === 1 ? t("service") : t("services")}
              </p>
              <div className="space-y-2">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex justify-between items-center"
                  >
                    <p className="text-foreground">{service.name}</p>
                    <p className="text-foreground/70">
                      {formatPrice(service.price, service.currency)}
                    </p>
                  </div>
                ))}
              </div>
              {/* Total if multiple services */}
              {services.length > 1 && (
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-foreground/10">
                  <p className="font-medium text-foreground">{t("total")}</p>
                  <p className="font-semibold text-foreground">
                    {formatPrice(totals.totalPrice, totals.currency)}
                  </p>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="border-t border-foreground/10 pt-3">
              <p className="text-sm text-foreground/60">{t("date_time")}</p>
              <p className="font-medium text-foreground">
                {formData.date && formatDateForDisplay(formData.date)}
              </p>
              <p className="text-sm text-foreground/70">
                {formData.timeSlot &&
                  `${formatTimeForDisplay(formData.timeSlot.start)} - ${formatTimeForDisplay(formData.timeSlot.end)}`}
              </p>
            </div>

            {/* Duration */}
            <div className="border-t border-foreground/10 pt-3">
              <p className="text-sm text-foreground/60">{t("duration")}</p>
              <p className="font-medium text-foreground">
                {formatDuration(totals.totalDurationMinutes)}
              </p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div>
          <h3 className="text-sm font-medium text-foreground/70 mb-3">
            {t("your_info")}
          </h3>
          <div className="bg-foreground/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              {isAuthenticated ? (
                <>
                  <p className="font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-foreground/50">
                    {t("logged_in_as")}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">
                    {formData.guestName}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {formData.guestPhone}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <Field.Root>
          <Field.Label>{t("notes")}</Field.Label>
          <Textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder={t("notes_placeholder")}
            rows={3}
            maxLength={500}
          />
        </Field.Root>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-foreground/10 px-6 py-4 shrink-0 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={goBack}
          disabled={bookingState === "submitting"}
          className="flex-1"
        >
          {t("back")}
        </Button>
        <Button
          onClick={handleConfirm}
          loading={bookingState === "submitting"}
          className="flex-1"
        >
          {t("confirm_booking")}
        </Button>
      </div>
    </div>
  );
}
