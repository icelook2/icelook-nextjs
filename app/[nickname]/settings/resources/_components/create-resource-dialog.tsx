"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { NumberField } from "@/lib/ui/number-field";
import { Select } from "@/lib/ui/select";
import { createResource } from "../_actions/resource.actions";
import { UNIT_PRESETS } from "../_lib/constants";

const formSchema = z.object({
  name: z.string().min(1, "Resource name is required").max(100),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.number().min(0),
  currentStock: z.number().min(0),
  lowStockThreshold: z.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beautyPageId: string;
  nickname: string;
  translations: {
    addResource: string;
    resourceName: string;
    resourceNamePlaceholder: string;
    unit: string;
    unitPlaceholder: string;
    costPerUnit: string;
    currentStock: string;
    lowStockThreshold: string;
    lowStockThresholdHint: string;
    cancel: string;
    create: string;
  };
  currency: string;
}

export function CreateResourceDialog({
  open,
  onOpenChange,
  beautyPageId,
  nickname,
  translations: t,
  currency,
}: CreateResourceDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      unit: "",
      costPerUnit: 0,
      currentStock: 0,
      lowStockThreshold: undefined,
    },
  });

  function handleSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createResource({
        beautyPageId,
        nickname,
        name: values.name,
        unit: values.unit,
        costPerUnitCents: Math.round(values.costPerUnit * 100),
        currentStock: values.currentStock,
        lowStockThreshold: values.lowStockThreshold ?? null,
      });

      if (result.success) {
        form.reset();
        onOpenChange(false);
      } else if (result.error) {
        form.setError("name", { message: result.error });
      }
    });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Dialog.Header>{t.addResource}</Dialog.Header>

          <Dialog.Body>
            <div className="space-y-4">
              {/* Resource Name */}
              <Field.Root invalid={!!form.formState.errors.name}>
                <Field.Label>{t.resourceName}</Field.Label>
                <Input
                  {...form.register("name")}
                  placeholder={t.resourceNamePlaceholder}
                />
                {form.formState.errors.name && (
                  <Field.Error>{form.formState.errors.name.message}</Field.Error>
                )}
              </Field.Root>

              {/* Unit */}
              <Field.Root invalid={!!form.formState.errors.unit}>
                <Field.Label>{t.unit}</Field.Label>
                <Select.Root
                  value={form.watch("unit")}
                  onValueChange={(value) => form.setValue("unit", value as string)}
                >
                  <Select.Trigger placeholder={t.unitPlaceholder} />
                  <Select.Content>
                    {UNIT_PRESETS.map((preset) => (
                      <Select.Item key={preset.value} value={preset.value}>
                        {preset.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {form.formState.errors.unit && (
                  <Field.Error>{form.formState.errors.unit.message}</Field.Error>
                )}
              </Field.Root>

              {/* Cost Per Unit */}
              <Field.Root>
                <Field.Label>{t.costPerUnit} ({currency})</Field.Label>
                <NumberField
                  value={form.watch("costPerUnit")}
                  onValueChange={(value) => form.setValue("costPerUnit", value ?? 0)}
                  min={0}
                  step={0.01}
                />
              </Field.Root>

              {/* Current Stock */}
              <Field.Root>
                <Field.Label>{t.currentStock}</Field.Label>
                <NumberField
                  value={form.watch("currentStock")}
                  onValueChange={(value) => form.setValue("currentStock", value ?? 0)}
                  min={0}
                  step={0.1}
                />
              </Field.Root>

              {/* Low Stock Threshold */}
              <Field.Root>
                <Field.Label>{t.lowStockThreshold}</Field.Label>
                <NumberField
                  value={form.watch("lowStockThreshold") ?? 0}
                  onValueChange={(value) =>
                    form.setValue("lowStockThreshold", value ?? undefined)
                  }
                  min={0}
                  step={1}
                />
                <Field.Description>{t.lowStockThresholdHint}</Field.Description>
              </Field.Root>
            </div>
          </Dialog.Body>

          <Dialog.Footer>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              {t.cancel}
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {t.create}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
