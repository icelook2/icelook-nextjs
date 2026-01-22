"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { GuestInfoFormData } from "./_lib/booking-schemas";

interface GuestFormFieldsTranslations {
  name: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  notes: string;
  notesPlaceholder: string;
}

interface GuestFormFieldsProps {
  register: UseFormRegister<GuestInfoFormData>;
  errors: FieldErrors<GuestInfoFormData>;
  translations: GuestFormFieldsTranslations;
}

/**
 * Form fields for guest (unauthenticated) users.
 *
 * Includes: name (required), phone (required), email (optional), notes (optional)
 */
export function GuestFormFields({
  register,
  errors,
  translations,
}: GuestFormFieldsProps) {
  return (
    <>
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {translations.name} *
        </label>
        <input
          {...register("name")}
          id="name"
          type="text"
          placeholder={translations.namePlaceholder}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {translations.phone} *
        </label>
        <input
          {...register("phone")}
          id="phone"
          type="tel"
          placeholder={translations.phonePlaceholder}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* Email (optional) */}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {translations.email}
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          placeholder={translations.emailPlaceholder}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Notes (optional) */}
      <div>
        <label
          htmlFor="notes"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {translations.notes}
        </label>
        <textarea
          {...register("notes")}
          id="notes"
          rows={3}
          placeholder={translations.notesPlaceholder}
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-red-500">{errors.notes.message}</p>
        )}
      </div>
    </>
  );
}
