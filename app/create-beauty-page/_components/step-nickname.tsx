"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { cn } from "@/lib/utils/cn";
import { checkNicknameAvailability } from "../_actions/check-nickname-availability.action";
import { StepLayout } from "./step-layout";

type NicknameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface StepNicknameProps {
  name: string;
  nickname: string;
  totalSteps: number;
  onUpdate: (nickname: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Converts a name to a URL-friendly slug.
 * "Anna's Nail Studio" → "annas-nail-studio"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, "") // Trim hyphens from start/end
    .slice(0, 30); // Max length
}

/**
 * Nickname step with Fleeso-style URL preview.
 * Shows the full URL (icelook.app/@nickname) in real-time with validation indicator.
 */
export function StepNickname({
  name,
  nickname,
  totalSteps,
  onUpdate,
  onNext,
  onPrevious,
}: StepNicknameProps) {
  const t = useTranslations("create_beauty_page");
  const tValidation = useTranslations("validation");

  const [status, setStatus] = useState<NicknameStatus>("idle");
  const [isPending, startTransition] = useTransition();

  const schema = z.object({
    nickname: z
      .string()
      .min(3, tValidation("nickname_min", { min: 3 }))
      .max(30, tValidation("nickname_max", { max: 30 }))
      .regex(
        /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/,
        tValidation("nickname_format"),
      ),
  });

  type FormData = z.infer<typeof schema>;

  // Auto-generate initial nickname from name if not set
  const initialNickname = nickname || slugify(name);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nickname: initialNickname },
  });

  const nicknameValue = watch("nickname");
  const displayNickname = nicknameValue || "your-nickname";

  // Debounced nickname availability check
  useEffect(() => {
    if (!nicknameValue || nicknameValue.length < 3) {
      setStatus("idle");
      return;
    }

    // Basic format validation
    const isValidFormat = /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/.test(
      nicknameValue,
    );
    if (!isValidFormat) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");

    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        const result = await checkNicknameAvailability(nicknameValue);
        if (result.available) {
          setStatus("available");
        } else {
          setStatus("taken");
        }
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nicknameValue]);

  const onSubmit = (data: FormData) => {
    // Don't proceed if nickname is not available
    if (status !== "available") {
      return;
    }
    onUpdate(data.nickname);
    onNext();
  };

  // Handle input change to auto-lowercase
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setValue("nickname", value, { shouldValidate: value.length >= 3 });
  };

  const isNextDisabled = status !== "available";

  return (
    <StepLayout
      currentStep={3}
      totalSteps={totalSteps}
      title={t("nickname.title")}
      subtitle={t("nickname.subtitle")}
      onPrevious={onPrevious}
      formId="nickname-form"
      nextDisabled={isNextDisabled}
      nextLoading={isPending}
      preview={<NicknamePreview nickname={displayNickname} status={status} />}
    >
      <form
        id="nickname-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <Field.Root>
          <Field.Label>{t("nickname.label")}</Field.Label>
          <div className="relative">
            {/* @ prefix */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-muted">@</span>
            </div>
            <Input
              type="text"
              placeholder={t("nickname.placeholder")}
              state={
                errors.nickname || status === "taken" || status === "invalid"
                  ? "error"
                  : status === "available"
                    ? "default"
                    : "default"
              }
              className={cn(
                "pl-7",
                status === "available" && "border-success focus:ring-success",
              )}
              autoFocus
              {...register("nickname", {
                onChange: handleNicknameChange,
              })}
            />
            {/* Status indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {status === "checking" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted" />
              )}
              {status === "available" && (
                <Check className="h-4 w-4 text-success" />
              )}
              {(status === "taken" || status === "invalid") && (
                <X className="h-4 w-4 text-danger" />
              )}
            </div>
          </div>

          {/* Status messages */}
          {errors.nickname && (
            <Field.Error>{errors.nickname.message}</Field.Error>
          )}
          {status === "taken" && !errors.nickname && (
            <Field.Error>{t("nickname.taken")}</Field.Error>
          )}
          {status === "invalid" && !errors.nickname && (
            <Field.Error>{t("nickname.invalid")}</Field.Error>
          )}
          {status === "available" && !errors.nickname && (
            <p className="mt-1 text-sm text-success">
              {t("nickname.available")}
            </p>
          )}
        </Field.Root>
      </form>
    </StepLayout>
  );
}

/**
 * URL preview component showing the full URL with validation status.
 * This is the key visual element inspired by Fleeso's design.
 */
function NicknamePreview({
  nickname,
  status,
}: {
  nickname: string;
  status: NicknameStatus;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div
        className={cn(
          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          status === "available"
            ? "border-success/30 bg-success/10 text-success"
            : status === "taken" || status === "invalid"
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-border bg-surface text-foreground",
        )}
      >
        <span className="text-muted">icelook.app/</span>
        <span>@{nickname}</span>
      </div>
      {status === "available" && <Check className="h-5 w-5 text-success" />}
      {status === "checking" && (
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      )}
      {(status === "taken" || status === "invalid") && (
        <X className="h-5 w-5 text-danger" />
      )}
    </div>
  );
}
