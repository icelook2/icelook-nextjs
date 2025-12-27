"use client";

import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import type { SpecialHours } from "@/lib/queries/business-hours";
import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { Switch } from "@/lib/ui/switch";
import { cn } from "@/lib/utils/cn";
import {
  createSpecialHours,
  deleteSpecialHours,
  updateSpecialHours,
} from "../_actions/business-hours.actions";

interface SpecialHoursSectionProps {
  beautyPageId: string;
  nickname: string;
  specialHours: SpecialHours[];
}

type DialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; item: SpecialHours };

export function SpecialHoursSection({
  beautyPageId,
  nickname,
  specialHours,
}: SpecialHoursSectionProps) {
  const t = useTranslations("business_hours");
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<SpecialHours | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleAdd() {
    setDialog({ open: true, mode: "create" });
  }

  function handleEdit(item: SpecialHours) {
    setDialog({ open: true, mode: "edit", item });
  }

  function handleClose() {
    setDialog({ open: false });
  }

  function handleDeleteClick(item: SpecialHours) {
    setDeleteConfirm(item);
  }

  function handleDeleteCancel() {
    setDeleteConfirm(null);
  }

  function handleDeleteConfirm() {
    if (!deleteConfirm) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteSpecialHours({
        id: deleteConfirm.id,
        beautyPageId,
        nickname,
      });
      if (result.success) {
        setDeleteConfirm(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      <SettingsGroup
        title={t("special_hours.title")}
        description={t("special_hours.description")}
        action={
          <Button variant="secondary" size="sm" onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("special_hours.add")}
          </Button>
        }
      >
        {specialHours.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted">
            {t("special_hours.empty")}
          </p>
        ) : (
          <div className="space-y-1">
            {specialHours.map((item) => (
              <SpecialHoursRow
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDeleteClick(item)}
              />
            ))}
          </div>
        )}
      </SettingsGroup>

      {/* Edit/Create Dialog */}
      {dialog.open && (
        <SpecialHoursDialog
          open={dialog.open}
          onClose={handleClose}
          mode={dialog.mode}
          item={dialog.mode === "edit" ? dialog.item : undefined}
          beautyPageId={beautyPageId}
          nickname={nickname}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog.Root
        open={deleteConfirm !== null}
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <AlertDialog.Portal open={deleteConfirm !== null}>
          <AlertDialog.Title>
            {t("special_hours.delete_title")}
          </AlertDialog.Title>
          <AlertDialog.Description>
            {t("special_hours.delete_description", {
              date: deleteConfirm
                ? format(new Date(deleteConfirm.date), "MMM d, yyyy")
                : "",
            })}
          </AlertDialog.Description>
          <AlertDialog.Actions>
            <Button variant="secondary" onClick={handleDeleteCancel}>
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              {t("delete")}
            </Button>
          </AlertDialog.Actions>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}

interface SpecialHoursRowProps {
  item: SpecialHours;
  onEdit: () => void;
  onDelete: () => void;
}

function SpecialHoursRow({ item, onEdit, onDelete }: SpecialHoursRowProps) {
  const t = useTranslations("business_hours");

  const dateDisplay = format(new Date(item.date), "MMM d, yyyy");
  const timeDisplay = item.is_open
    ? `${item.open_time?.slice(0, 5)} - ${item.close_time?.slice(0, 5)}`
    : t("closed");

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg px-3 py-3",
        "hover:bg-surface",
      )}
    >
      {/* Date */}
      <div className="w-28 shrink-0">
        <span className="font-medium">{dateDisplay}</span>
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <span className="truncate text-sm text-muted">{item.name || "—"}</span>
      </div>

      {/* Status / Time */}
      <div className="w-28 shrink-0 text-right">
        <span
          className={cn(
            "text-sm",
            item.is_open ? "text-foreground" : "text-muted",
          )}
        >
          {timeDisplay}
        </span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-danger hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface SpecialHoursDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  item?: SpecialHours;
  beautyPageId: string;
  nickname: string;
}

interface SpecialHoursFormValues {
  date: string;
  name: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

function SpecialHoursDialog({
  open,
  onClose,
  mode,
  item,
  beautyPageId,
  nickname,
}: SpecialHoursDialogProps) {
  const t = useTranslations("business_hours");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SpecialHoursFormValues>({
    defaultValues: {
      date: item?.date ?? "",
      name: item?.name ?? "",
      isOpen: item?.is_open ?? false,
      openTime: item?.open_time?.slice(0, 5) ?? "09:00",
      closeTime: item?.close_time?.slice(0, 5) ?? "18:00",
    },
  });

  const watchedIsOpen = watch("isOpen");

  function onSubmit(data: SpecialHoursFormValues) {
    setServerError(null);
    startTransition(async () => {
      if (mode === "create") {
        const result = await createSpecialHours({
          beautyPageId,
          nickname,
          date: data.date,
          name: data.name || undefined,
          isOpen: data.isOpen,
          openTime: data.isOpen ? data.openTime : undefined,
          closeTime: data.isOpen ? data.closeTime : undefined,
        });

        if (result.success) {
          onClose();
          router.refresh();
        } else {
          setServerError(result.error);
        }
      } else if (item) {
        const result = await updateSpecialHours({
          id: item.id,
          beautyPageId,
          nickname,
          name: data.name || undefined,
          isOpen: data.isOpen,
          openTime: data.isOpen ? data.openTime : undefined,
          closeTime: data.isOpen ? data.closeTime : undefined,
        });

        if (result.success) {
          onClose();
          router.refresh();
        } else {
          setServerError(result.error);
        }
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal open={open} className="bg-background">
        <Dialog.Header onClose={onClose}>
          {mode === "create" ? t("special_hours.add") : t("special_hours.edit")}
        </Dialog.Header>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Dialog.Body>
            <div className="space-y-4">
              {/* Date */}
              {mode === "create" && (
                <Controller
                  name="date"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Field.Root name="date" invalid={!!errors.date}>
                      <Field.Label>{t("special_hours.date")}</Field.Label>
                      <Input
                        type="date"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </Field.Root>
                  )}
                />
              )}

              {/* Name */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Field.Root name="name">
                    <Field.Label>{t("special_hours.name")}</Field.Label>
                    <Input
                      type="text"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder={t("special_hours.name_placeholder")}
                    />
                  </Field.Root>
                )}
              />

              {/* Open/Closed */}
              <Controller
                name="isOpen"
                control={control}
                render={({ field }) => (
                  <Field.Root name="isOpen">
                    <Field.Label className="flex cursor-pointer items-center gap-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span>{field.value ? t("open") : t("closed")}</span>
                    </Field.Label>
                  </Field.Root>
                )}
              />

              {/* Time inputs */}
              {watchedIsOpen && (
                <div className="flex items-center gap-2">
                  <Controller
                    name="openTime"
                    control={control}
                    render={({ field }) => (
                      <Field.Root name="openTime" className="flex-1">
                        <Field.Label>{t("open_time")}</Field.Label>
                        <Input
                          type="time"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </Field.Root>
                    )}
                  />
                  <Controller
                    name="closeTime"
                    control={control}
                    render={({ field }) => (
                      <Field.Root name="closeTime" className="flex-1">
                        <Field.Label>{t("close_time")}</Field.Label>
                        <Input
                          type="time"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </Field.Root>
                    )}
                  />
                </div>
              )}

              {/* Server error */}
              {serverError && (
                <p className="text-sm text-danger">{serverError}</p>
              )}
            </div>
          </Dialog.Body>

          <Dialog.Footer className="justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending} loading={isPending}>
              {t("save")}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
