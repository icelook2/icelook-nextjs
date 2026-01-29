"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import { generateLocalId, type ServiceData } from "../_lib/types";
import { BeautyPagePreview } from "./previews/beauty-page-preview";
import { StepLayout } from "./step-layout";

/** Maximum services during onboarding - users can add more later in settings */
const MAX_SERVICES_ONBOARDING = 3;

interface StepServicesProps {
  name: string;
  nickname: string;
  avatarPreviewUrl: string | null;
  services: ServiceData[];
  totalSteps: number;
  onUpdate: (services: ServiceData[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

/**
 * Step 3: Add Services
 *
 * Allows users to add multiple services to their beauty page.
 * Services are stored in an array and can be added, edited, or removed.
 */
export function StepServices({
  name,
  nickname,
  avatarPreviewUrl,
  services,
  totalSteps,
  onUpdate,
  onNext,
  onPrevious,
  onSkip,
}: StepServicesProps) {
  const t = useTranslations("create_beauty_page");
  const tServices = useTranslations("create_beauty_page.services");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(
    null,
  );

  const handleAddService = (service: Omit<ServiceData, "id">) => {
    const newService: ServiceData = {
      ...service,
      id: generateLocalId(),
    };
    onUpdate([...services, newService]);
    setIsAddDialogOpen(false);
  };

  const handleEditService = (service: ServiceData) => {
    onUpdate(services.map((s) => (s.id === service.id ? service : s)));
    setEditingService(null);
  };

  const handleDeleteService = (serviceId: string) => {
    onUpdate(services.filter((s) => s.id !== serviceId));
  };

  return (
    <>
      <StepLayout
        currentStep={5}
        totalSteps={totalSteps}
        title={tServices("title")}
        subtitle={tServices("subtitle")}
        previewLabel={t("preview.label")}
        preview={
          <BeautyPagePreview
            name={name}
            nickname={nickname}
            avatarPreviewUrl={avatarPreviewUrl}
            services={services}
          />
        }
        onBack={onPrevious}
      >
        <div className="space-y-6">
          {/* Services list with placeholder cards for remaining slots */}
          <div className="space-y-2">
            {/* Real services */}
            {services.map((service) => (
              <ServiceListItem
                key={service.id}
                service={service}
                onEdit={() => setEditingService(service)}
                onDelete={() => handleDeleteService(service.id)}
              />
            ))}

            {/* Placeholder cards for remaining slots */}
            {Array.from({
              length: MAX_SERVICES_ONBOARDING - services.length,
            }).map((_, index) => (
              <PlaceholderCard
                key={`placeholder-${index}`}
                onAdd={() => setIsAddDialogOpen(true)}
              />
            ))}
          </div>

          {/* Hint when at max */}
          {services.length >= MAX_SERVICES_ONBOARDING && (
            <p className="text-center text-sm text-muted">
              {tServices("max_reached_hint")}
            </p>
          )}

          {/* Skip button - only when no services */}
          {services.length === 0 && (
            <Button variant="ghost" onClick={onSkip}>
              {tServices("skip")}
            </Button>
          )}

          {/* Continue button - only show when services exist */}
          {services.length > 0 && (
            <div className="pt-2">
              <Button onClick={onNext}>{t("navigation.continue")}</Button>
            </div>
          )}
        </div>
      </StepLayout>

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
// Placeholder Card
// ============================================================================

interface PlaceholderCardProps {
  onAdd: () => void;
}

function PlaceholderCard({ onAdd }: PlaceholderCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-3"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem",
        borderRadius: "0.75rem",
        borderWidth: "2px",
        borderStyle: "dashed",
      }}
    >
      {/* Placeholder icon area */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/30"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          minWidth: "40px",
          minHeight: "40px",
          borderRadius: "0.5rem",
          opacity: 0.3,
        }}
      >
        <Scissors
          className="h-5 w-5 text-muted"
          style={{ width: "20px", height: "20px" }}
        />
      </div>

      {/* Placeholder text area */}
      <div className="min-w-0 flex-1">
        <div
          className="h-4 w-24 rounded bg-muted/30"
          style={{
            height: "16px",
            width: "96px",
            borderRadius: "0.25rem",
            opacity: 0.3,
          }}
        />
        <div
          className="mt-1 h-3 w-16 rounded bg-muted/30"
          style={{
            marginTop: "4px",
            height: "12px",
            width: "64px",
            borderRadius: "0.25rem",
            opacity: 0.3,
          }}
        />
      </div>

      {/* Plus button on the right */}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 transition-colors hover:bg-blue-500/30"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          minWidth: "40px",
          minHeight: "40px",
          borderRadius: "9999px",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
        }}
      >
        <Plus
          className="h-5 w-5 text-blue-500"
          style={{ width: "20px", height: "20px", color: "rgb(59, 130, 246)" }}
        />
      </button>
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

  // Reset form when dialog opens in add mode
  // This handles the case when `open` prop changes from parent
  useEffect(() => {
    if (open && mode === "add") {
      reset({
        name: "",
        price: DEFAULT_PRICE,
        durationMinutes: DEFAULT_DURATION,
      });
    }
  }, [open, mode, reset]);

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

  const durationItems = DURATION_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
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

        <Dialog.Footer className="flex-col-reverse sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit(handleFormSubmit)}
            className="w-full sm:w-auto"
          >
            {mode === "add" ? t("add") : t("save")}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
