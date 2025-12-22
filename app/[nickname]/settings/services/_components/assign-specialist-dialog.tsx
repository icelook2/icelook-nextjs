"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { Select } from "@/lib/ui/select";
import { assignSpecialist } from "../_actions";
import { DURATION_OPTIONS, parsePriceInput } from "./constants";

type BeautyPageMemberWithProfile = {
  id: string;
  beauty_page_id: string;
  user_id: string;
  roles: ("admin" | "specialist")[];
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

interface AssignSpecialistDialogProps {
  serviceId: string;
  serviceName: string;
  nickname: string;
  specialists: BeautyPageMemberWithProfile[];
  assignedMemberIds: string[];
}

const formSchema = z.object({
  memberId: z.string().uuid(),
  price: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(480),
});

type FormData = z.infer<typeof formSchema>;

export function AssignSpecialistDialog({
  serviceId,
  serviceName,
  nickname,
  specialists,
  assignedMemberIds,
}: AssignSpecialistDialogProps) {
  const t = useTranslations("services");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const availableSpecialists = specialists.filter(
    (s) => !assignedMemberIds.includes(s.id),
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: "",
      price: "",
      durationMinutes: 60,
    },
  });

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setServerError(null);
      reset();
    }
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    const priceCents = parsePriceInput(data.price);

    startTransition(async () => {
      const result = await assignSpecialist({
        serviceId,
        memberId: data.memberId,
        priceCents,
        durationMinutes: data.durationMinutes,
        nickname,
      });

      if (result.success) {
        setOpen(false);
        reset();
      } else {
        setServerError(result.error);
      }
    });
  }

  if (availableSpecialists.length === 0) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1 rounded px-2 py-1 text-sm cursor-not-allowed"
        title={t("no_specialists_available")}
      >
        <UserPlus className="h-3.5 w-3.5" />
        {t("assign_specialist")}
      </button>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors hover:/20"
      >
        <UserPlus className="h-3.5 w-3.5" />
        {t("assign_specialist")}
      </button>

      <Dialog.Portal open={open} size="md">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("assign_specialist_title")}
        </Dialog.Header>
        <Dialog.Body>
          <p className="mb-4 text-sm text-">
            {t("assign_specialist_description", { service: serviceName })}
          </p>

          <form
            id="assign-specialist-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field.Root>
              <Field.Label>{t("specialist_label")}</Field.Label>
              <Controller
                name="memberId"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <Select.Trigger
                      placeholder={t("specialist_placeholder")}
                      state={errors.memberId ? "error" : "default"}
                    />
                    <Select.Content>
                      {availableSpecialists.map((specialist) => (
                        <Select.Item key={specialist.id} value={specialist.id}>
                          {specialist.profiles.full_name ||
                            t("unnamed_specialist")}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
              <Field.Error>{errors.memberId?.message}</Field.Error>
            </Field.Root>

            <div className="grid grid-cols-2 gap-4">
              <Field.Root>
                <Field.Label>{t("price_label")}</Field.Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  state={errors.price ? "error" : "default"}
                  {...register("price")}
                />
                <Field.Error>{errors.price?.message}</Field.Error>
              </Field.Root>

              <Field.Root>
                <Field.Label>{t("duration_label")}</Field.Label>
                <Controller
                  name="durationMinutes"
                  control={control}
                  render={({ field }) => (
                    <Select.Root
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <Select.Trigger
                        state={errors.durationMinutes ? "error" : "default"}
                      />
                      <Select.Content>
                        {DURATION_OPTIONS.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                />
                <Field.Error>{errors.durationMinutes?.message}</Field.Error>
              </Field.Root>
            </div>

            {serverError && <p className="text-sm text-">{serverError}</p>}
          </form>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="assign-specialist-form"
            loading={isPending}
          >
            {t("assign")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
