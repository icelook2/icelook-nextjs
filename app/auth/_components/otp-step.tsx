"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { OtpInput } from "@/lib/ui/otp-input";
import { resendOtp, verifyOtp } from "../actions";
import { createTranslatedSchemas } from "../schemas";

interface OtpStepProps {
  email: string;
  redirectTo: string;
  onBack: () => void;
}

const COOLDOWN_SECONDS = 60;

export function OtpStep({ email, redirectTo, onBack }: OtpStepProps) {
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  const formSchema = useMemo(() => {
    const schemas = createTranslatedSchemas((key) => tValidation(key));
    return z.object({ code: schemas.otp });
  }, [tValidation]);

  type FormData = z.infer<typeof formSchema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  function onSubmit(data: FormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await verifyOtp(email, data.code, redirectTo);
      // Only reaches here on error (redirect throws on success)
      if (!result.success) {
        setServerError(result.error);
      }
    });
  }

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setServerError(null);

    const result = await resendOtp(email);

    if (result.success) {
      setCooldown(COOLDOWN_SECONDS);
    } else {
      setServerError(result.error);
    }

    setIsResending(false);
  }, [cooldown, isResending, email]);

  const error = errors.code?.message || serverError;
  const canResend = cooldown <= 0 && !isResending;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field.Root>
          <Field.Label>{t("otp_label")}</Field.Label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <OtpInput {...field} autoFocus error={!!error} />
            )}
          />
          <Field.Error>{error}</Field.Error>
        </Field.Root>

        <Button type="submit" loading={isPending} className="w-full">
          {t("verify")}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Button type="button" variant="link" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Button>

        <Button
          type="button"
          variant="link-primary"
          onClick={handleResend}
          disabled={!canResend}
          loading={isResending}
        >
          {cooldown > 0 ? t("resend_in", { seconds: cooldown }) : t("resend")}
        </Button>
      </div>
    </div>
  );
}
