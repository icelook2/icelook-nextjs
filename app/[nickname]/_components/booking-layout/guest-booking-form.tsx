"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import {
  createGuestInfoSchema,
  type GuestInfoFormData,
  type GuestInfoValidationMessages,
} from "../booking/_lib/booking-schemas";

interface GuestBookingFormProps {
  formTranslations: {
    namePlaceholder: string;
    phonePlaceholder: string;
  };
  validationTranslations: GuestInfoValidationMessages;
  bookButtonText: string;
  isSubmitting: boolean;
  disabled: boolean;
  onSubmit: (data: GuestInfoFormData) => void;
}

export function GuestBookingForm({
  formTranslations,
  validationTranslations,
  bookButtonText,
  isSubmitting,
  disabled,
  onSubmit,
}: GuestBookingFormProps) {
  const guestSchema = createGuestInfoSchema(validationTranslations);

  const form = useForm<GuestInfoFormData>({
    resolver: zodResolver(guestSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const canSubmit = !disabled && form.formState.isValid;

  return (
    <form
      id="booking-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-3"
    >
      {/* Name */}
      <div>
        <input
          {...form.register("name")}
          type="text"
          placeholder={formTranslations.namePlaceholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <input
          {...form.register("phone")}
          type="tel"
          placeholder={formTranslations.phonePlaceholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {form.formState.errors.phone && (
          <p className="mt-1 text-xs text-red-500">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Booking...
          </>
        ) : (
          bookButtonText
        )}
      </Button>
    </form>
  );
}
