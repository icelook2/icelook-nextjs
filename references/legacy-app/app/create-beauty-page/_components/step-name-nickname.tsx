"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { checkNicknameAvailability } from "../_actions/check-nickname-availability.action";
import {
  createTranslatedNameNicknameSchema,
  type NameNicknameFormData,
} from "../_lib/schemas";
import type { StepProps } from "../_lib/types";
import { BasicsPreview } from "./previews";
import { SplitLayout } from "./split-layout";

/**
 * Converts a name to a URL-friendly slug.
 * "Anna's Beauty Studio" → "annas-beauty-studio"
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

export function StepNameNickname({
  state,
  onUpdate,
  onNext,
  onBack,
}: StepProps) {
  const t = useTranslations("create_beauty_page.name_nickname");
  const tValidation = useTranslations("validation");

  const [nicknameStatus, setNicknameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [isPending, startTransition] = useTransition();

  // Track if user has manually edited the nickname
  const hasManuallyEditedRef = useRef(false);

  const formSchema = createTranslatedNameNicknameSchema(tValidation);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NameNicknameFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: state.name,
      nickname: state.nickname,
    },
  });

  const nameValue = watch("name");
  const nicknameValue = watch("nickname");

  // Auto-generate nickname from name (unless manually edited)
  useEffect(() => {
    if (hasManuallyEditedRef.current) {
      return;
    }

    const slug = slugify(nameValue);
    if (slug && slug !== nicknameValue) {
      setValue("nickname", slug, { shouldValidate: slug.length >= 3 });
    }
  }, [nameValue, nicknameValue, setValue]);

  // Debounced nickname availability check
  useEffect(() => {
    if (!nicknameValue || nicknameValue.length < 3) {
      setNicknameStatus("idle");
      return;
    }

    // Basic format validation
    const isValidFormat = /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/.test(
      nicknameValue,
    );
    if (!isValidFormat) {
      setNicknameStatus("invalid");
      return;
    }

    setNicknameStatus("checking");

    const timeoutId = setTimeout(() => {
      startTransition(async () => {
        const result = await checkNicknameAvailability(nicknameValue);
        if (result.available) {
          setNicknameStatus("available");
        } else {
          setNicknameStatus("taken");
        }
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nicknameValue]);

  const onSubmit = (data: NameNicknameFormData) => {
    // Don't proceed if nickname is taken
    if (nicknameStatus === "taken") {
      return;
    }

    onUpdate({
      name: data.name,
      nickname: data.nickname,
    });
    onNext();
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mark as manually edited once user types in the nickname field
    hasManuallyEditedRef.current = true;
    // Auto-lowercase
    e.target.value = e.target.value.toLowerCase();
  };

  return (
    <>
      <SplitLayout
        title={t("title")}
        subtitle={t("subtitle")}
        form={
          <form
            id="name-nickname-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Name */}
            <Field.Root>
              <Field.Label>{t("name_label")}</Field.Label>
              <Input
                type="text"
                placeholder={t("name_placeholder")}
                state={errors.name ? "error" : "default"}
                {...register("name")}
              />
              <Field.Error>{errors.name?.message}</Field.Error>
            </Field.Root>

            {/* Nickname */}
            <Field.Root>
              <Field.Label>{t("nickname_label")}</Field.Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t("nickname_placeholder")}
                  state={
                    errors.nickname || nicknameStatus === "taken"
                      ? "error"
                      : "default"
                  }
                  className={`pr-10 ${nicknameStatus === "available" ? "border-success focus:ring-success" : ""}`}
                  {...register("nickname", {
                    onChange: handleNicknameChange,
                  })}
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {nicknameStatus === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted" />
                  )}
                  {nicknameStatus === "available" && (
                    <Check className="h-4 w-4 text-success" />
                  )}
                  {nicknameStatus === "taken" && (
                    <X className="h-4 w-4 text-danger" />
                  )}
                </div>
              </div>
              <Field.Description>
                {t("nickname_hint", { nickname: nicknameValue || "..." })}
              </Field.Description>
              {errors.nickname && (
                <Field.Error>{errors.nickname.message}</Field.Error>
              )}
              {nicknameStatus === "taken" && !errors.nickname && (
                <Field.Error>{t("nickname_taken")}</Field.Error>
              )}
              {nicknameStatus === "available" && !errors.nickname && (
                <p className="mt-1 text-sm text-success">
                  {t("nickname_available")}
                </p>
              )}
            </Field.Root>
          </form>
        }
        preview={<BasicsPreview name={nameValue} nickname={nicknameValue} />}
      />

      {/* Fixed bottom actions */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-4xl justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            {t("back")}
          </Button>
          <Button
            type="submit"
            form="name-nickname-form"
            disabled={
              nicknameStatus === "taken" || nicknameStatus === "checking"
            }
            loading={isPending}
          >
            {t("next")}
          </Button>
        </div>
      </div>
    </>
  );
}
