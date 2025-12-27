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
  groupId: string;
  nickname: string;
  specialists: BeautyPageMemberWithProfile[];
  assignedMemberIds: string[];
  variant?: "primary" | "secondary";
}

const formSchema = z.object({
  memberId: z.string().min(1),
  price: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val);
      return !Number.isNaN(num) && num >= 0 && num <= 100000;
    },
    { message: "Invalid price" },
  ),
  duration: z.number().min(15).max(480),
});

type FormData = z.infer<typeof formSchema>;

export function AssignSpecialistDialog({
  serviceId,
  serviceName,
  groupId,
  nickname,
  specialists,
  assignedMemberIds,
  variant = "secondary",
}: AssignSpecialistDialogProps) {
  const t = useTranslations("service_groups");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Filter out already assigned specialists
  const availableSpecialists = specialists.filter(
    (s) => !assignedMemberIds.includes(s.id),
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: "",
      price: "0",
      duration: 60,
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

    startTransition(async () => {
      const result = await assignSpecialist({
        serviceId,
        memberId: data.memberId,
        priceCents: parsePriceInput(data.price),
        durationMinutes: data.duration,
        groupId,
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

  // Don't render if no specialists available
  if (availableSpecialists.length === 0) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        {t("assign_specialist")}
      </Button>

      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          {t("assign_specialist_title")}
        </Dialog.Header>
        <Dialog.Body>
          <p className="mb-4 text-sm text-muted">
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
                    items={availableSpecialists.map((s) => ({
                      value: s.id,
                      label: s.profiles.full_name || t("unnamed_specialist"),
                    }))}
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
                name="duration"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    items={DURATION_OPTIONS}
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <Select.Trigger
                      state={errors.duration ? "error" : "default"}
                    />
                    <Select.Content>
                      {DURATION_OPTIONS.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
              <Field.Error>{errors.duration?.message}</Field.Error>
            </Field.Root>

            {serverError && (
              <p className="text-sm text-danger">{serverError}</p>
            )}
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
