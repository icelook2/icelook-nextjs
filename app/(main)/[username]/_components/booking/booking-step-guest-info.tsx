"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  createTranslatedGuestInfoSchema,
  useBooking,
} from "@/lib/appointments";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";

export function BookingStepGuestInfo() {
  const t = useTranslations("booking");
  const { formData, setGuestInfo, goToStep, goBack } = useBooking();

  // Create translated schema
  const guestInfoSchema = createTranslatedGuestInfoSchema((key) => t(key));

  type FormData = z.infer<typeof guestInfoSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      name: formData.guestName || "",
      phone: formData.guestPhone || "",
    },
    mode: "onChange",
  });

  const onSubmit = (data: FormData) => {
    setGuestInfo(data.name, data.phone);
    goToStep("confirmation");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <p className="text-sm text-foreground/60">
          {t("guest_info_description")}
        </p>

        {/* Name Field */}
        <Field.Root>
          <Field.Label>{t("guest_name")}</Field.Label>
          <Input
            {...register("name")}
            placeholder={t("guest_name_placeholder")}
            autoComplete="name"
          />
          <Field.Error>{errors.name?.message}</Field.Error>
        </Field.Root>

        {/* Phone Field */}
        <Field.Root>
          <Field.Label>{t("guest_phone")}</Field.Label>
          <Input
            {...register("phone")}
            type="tel"
            placeholder={t("guest_phone_placeholder")}
            autoComplete="tel"
          />
          <Field.Error>{errors.phone?.message}</Field.Error>
        </Field.Root>

        {/* Login Prompt */}
        <div className="text-center pt-4 border-t border-foreground/10">
          <p className="text-sm text-foreground/50">
            {t("login_prompt")}{" "}
            <Link
              href="/auth"
              className="text-violet-500 hover:text-violet-600"
            >
              {t("login_link")}
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-foreground/10 px-6 py-4 shrink-0 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={goBack}
          className="flex-1"
        >
          {t("back")}
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          {t("continue")}
        </Button>
      </div>
    </form>
  );
}
