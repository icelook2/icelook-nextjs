"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { NumberField } from "@/lib/ui/number-field";
import { Select } from "@/lib/ui/select";
import {
  DEFAULT_DURATION,
  DEFAULT_PRICE,
  DURATION_OPTIONS,
  formatDuration,
  formatPrice,
} from "../_lib/constants";
import {
  generateLocalId,
  type ServiceData,
  type StepProps,
} from "../_lib/types";
import { ServicesPreview } from "./previews";
import { SplitLayout } from "./split-layout";

/**
 * Step 2: Add Services
 *
 * Allows users to add multiple services to their beauty page.
 * Services are stored in an array and can be added, edited, or removed.
 */
export function StepServices({
  state,
  onUpdate,
  onNext,
  onBack,
  onSkip,
}: StepProps) {
  const t = useTranslations("create_beauty_page.services");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(
    null,
  );

  const handleAddService = (service: Omit<ServiceData, "id">) => {
    const newService: ServiceData = {
      ...service,
      id: generateLocalId(),
    };
    onUpdate({
      services: [...state.services, newService],
    });
    setIsAddDialogOpen(false);
  };

  const handleEditService = (service: ServiceData) => {
    onUpdate({
      services: state.services.map((s) => (s.id === service.id ? service : s)),
    });
    setEditingService(null);
  };

  const handleDeleteService = (serviceId: string) => {
    onUpdate({
      services: state.services.filter((s) => s.id !== serviceId),
    });
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <>
      <SplitLayout
        title={t("title")}
        subtitle={t("subtitle")}
        form={
          <div className="space-y-4">
            {/* Services list */}
            {state.services.length > 0 ? (
              <div className="space-y-2">
                {state.services.map((service) => (
                  <ServiceListItem
                    key={service.id}
                    service={service}
                    onEdit={() => setEditingService(service)}
                    onDelete={() => handleDeleteService(service.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState onAdd={() => setIsAddDialogOpen(true)} />
            )}

            {/* Add button (when list is not empty) */}
            {state.services.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => setIsAddDialogOpen(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("add_another")}
              </Button>
            )}
          </div>
        }
        preview={<ServicesPreview services={state.services} />}
      />

      {/* Fixed bottom actions */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            {t("back")}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onSkip}>
              {t("skip")}
            </Button>
            <Button onClick={handleNext}>{t("next")}</Button>
          </div>
        </div>
      </div>

      {/* Add Service Dialog */}
      <ServiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddService}
        mode="add"
      />

      {/* Edit Service Dialog */}
      {editingService && (
        <ServiceDialog
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          onSubmit={handleEditService}
          mode="edit"
          initialData={editingService}
        />
      )}
    </>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  onAdd: () => void;
}

function EmptyState({ onAdd }: EmptyStateProps) {
  const t = useTranslations("create_beauty_page.services");

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <Scissors className="h-7 w-7 text-accent" />
      </div>
      <h3 className="mb-2 font-semibold">{t("empty_title")}</h3>
      <p className="mb-6 max-w-xs text-sm text-muted">{t("empty_subtitle")}</p>
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        {t("add_first")}
      </Button>
    </div>
  );
}

// ============================================================================
// Service List Item
// ============================================================================

interface ServiceListItemProps {
  service: ServiceData;
  onEdit: () => void;
  onDelete: () => void;
}

function ServiceListItem({ service, onEdit, onDelete }: ServiceListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/20">
        <Scissors className="h-5 w-5 text-violet-700 dark:text-violet-400" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{service.name}</p>
        <p className="flex items-center gap-2 text-sm text-muted">
          <span>{formatPrice(service.priceCents)} UAH</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(service.durationMinutes)}
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Service Dialog (Add/Edit)
// ============================================================================

const serviceSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  price: z.number().min(1).max(1_000_000),
  durationMinutes: z.number().min(5),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceDialogAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<ServiceData, "id">) => void;
  mode: "add";
  initialData?: never;
}

interface ServiceDialogEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceData) => void;
  mode: "edit";
  initialData: ServiceData;
}

type ServiceDialogProps = ServiceDialogAddProps | ServiceDialogEditProps;

function ServiceDialog({
  open,
  onOpenChange,
  onSubmit,
  mode,
  initialData,
}: ServiceDialogProps) {
  const t = useTranslations("create_beauty_page.services.dialog");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      price: initialData ? initialData.priceCents / 100 : DEFAULT_PRICE,
      durationMinutes: initialData?.durationMinutes ?? DEFAULT_DURATION,
    },
  });

  const handleFormSubmit = (data: ServiceFormData) => {
    if (mode === "edit" && initialData) {
      onSubmit({
        ...initialData,
        name: data.name,
        priceCents: Math.round(data.price * 100),
        durationMinutes: data.durationMinutes,
      });
    } else {
      onSubmit({
        name: data.name,
        priceCents: Math.round(data.price * 100),
        durationMinutes: data.durationMinutes,
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && mode === "add") {
      // Reset form when opening add dialog
      reset({
        name: "",
        price: DEFAULT_PRICE,
        durationMinutes: DEFAULT_DURATION,
      });
    }
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  const durationItems = DURATION_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => handleOpenChange(false)}>
          {mode === "add" ? t("add_title") : t("edit_title")}
        </Dialog.Header>

        <Dialog.Body>
          <form
            id="service-form"
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-4"
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

            {/* Price */}
            <Field.Root>
              <Field.Label>{t("price_label")} (UAH)</Field.Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <NumberField
                    value={field.value}
                    onValueChange={field.onChange}
                    min={1}
                    max={1_000_000}
                    step={10}
                  />
                )}
              />
              <Field.Error>{errors.price?.message}</Field.Error>
            </Field.Root>

            {/* Duration */}
            <Field.Root>
              <Field.Label>{t("duration_label")}</Field.Label>
              <Controller
                name="durationMinutes"
                control={control}
                render={({ field }) => (
                  <Select.Root
                    items={durationItems}
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <Select.Trigger
                      items={durationItems}
                      placeholder={t("duration_placeholder")}
                      state={errors.durationMinutes ? "error" : "default"}
                    />
                    <Select.Content>
                      {durationItems.map((item) => (
                        <Select.Item key={item.value} value={item.value}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
              <Field.Error>{errors.durationMinutes?.message}</Field.Error>
            </Field.Root>
          </form>
        </Dialog.Body>

        <Dialog.Footer>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit(handleFormSubmit)}>
            {mode === "add" ? t("add") : t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
