"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import { Select } from "@/lib/ui/select";
import { Button } from "@/lib/ui/button";
import { Switch } from "@/lib/ui/switch";
import { SPECIALTIES, type Specialty } from "@/app/(main)/settings/become-specialist/_lib/types";
import {
  updateSpecialistProfile,
  deactivateSpecialist,
  deleteSpecialist,
} from "../../_actions/specialist-settings.action";

interface ProfileSettingsFormProps {
  specialistId: string;
  initialData: {
    displayName: string;
    bio: string;
    specialty: Specialty;
    username: string;
    isActive: boolean;
  };
}

export function ProfileSettingsForm({
  specialistId,
  initialData,
}: ProfileSettingsFormProps) {
  const t = useTranslations("specialist.settings.profile");
  const tSpecialties = useTranslations("specialist.specialties");
  const tValidation = useTranslations("validation");
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const schema = z.object({
    displayName: z
      .string()
      .min(2, tValidation("display_name_min"))
      .max(100, tValidation("display_name_max")),
    bio: z.string().max(500, tValidation("bio_max")).optional(),
    specialty: z.enum(SPECIALTIES),
    username: z
      .string()
      .min(3, tValidation("username_min"))
      .max(30, tValidation("username_max"))
      .regex(/^[a-z0-9_-]+$/, tValidation("username_format")),
    isActive: z.boolean(),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: initialData.displayName,
      bio: initialData.bio,
      specialty: initialData.specialty,
      username: initialData.username,
      isActive: initialData.isActive,
    },
  });

  const currentUsername = watch("username");
  const isActive = watch("isActive");

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateSpecialistProfile(specialistId, {
        displayName: data.displayName,
        bio: data.bio || "",
        specialty: data.specialty,
        username: data.username,
        isActive: data.isActive,
      });

      if (result.success) {
        // If username changed, redirect to new URL
        if (result.username !== initialData.username) {
          router.replace(`/@${result.username}/settings/profile`);
        } else {
          router.refresh();
        }
      }
    });
  };

  const handleDeactivate = () => {
    setIsDeactivating(true);
    startTransition(async () => {
      const result = await deactivateSpecialist(specialistId);
      if (result.success) {
        router.refresh();
      }
      setIsDeactivating(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSpecialist(specialistId);
      if (result.success) {
        router.replace("/settings");
      }
      setShowDeleteConfirm(false);
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-foreground"
          >
            {t("display_name")}
          </label>
          <Input
            id="displayName"
            {...register("displayName")}
            placeholder={t("display_name_placeholder")}
            state={errors.displayName ? "error" : "default"}
          />
          {errors.displayName && (
            <p className="text-sm text-red-500">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-foreground"
          >
            {t("username")}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-foreground/60">@</span>
            <Input
              id="username"
              {...register("username")}
              placeholder={t("username_placeholder")}
              state={errors.username ? "error" : "default"}
            />
          </div>
          {errors.username && (
            <p className="text-sm text-red-500">{errors.username.message}</p>
          )}
          <p className="text-xs text-foreground/60">
            {t("profile_url")}: icelook.io/@{currentUsername}
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="specialty"
            className="block text-sm font-medium text-foreground"
          >
            {t("specialty")}
          </label>
          <Select.Root
            value={watch("specialty")}
            onValueChange={(value) =>
              setValue("specialty", value as Specialty, { shouldDirty: true })
            }
          >
            <Select.Trigger id="specialty" placeholder={t("specialty_placeholder")} />
            <Select.Content>
              {SPECIALTIES.map((specialty) => (
                <Select.Item key={specialty} value={specialty}>
                  {tSpecialties(specialty)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-foreground"
          >
            {t("bio")}
          </label>
          <Textarea
            id="bio"
            {...register("bio")}
            placeholder={t("bio_placeholder")}
            rows={3}
            state={errors.bio ? "error" : "default"}
          />
          {errors.bio && (
            <p className="text-sm text-red-500">{errors.bio.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-foreground/10 bg-foreground/5 p-4">
          <div>
            <p className="font-medium text-foreground">{t("visibility")}</p>
            <p className="text-sm text-foreground/60">
              {isActive ? t("visibility_active") : t("visibility_hidden")}
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue("isActive", checked, { shouldDirty: true })
            }
          />
        </div>

        <Button type="submit" className="w-full" disabled={!isDirty || isPending}>
          {isPending ? t("saving") : t("save_changes")}
        </Button>
      </form>

      {/* Danger Zone */}
      <div className="space-y-4 border-t border-foreground/10 pt-6">
        <h3 className="text-sm font-semibold text-red-500">{t("danger_zone")}</h3>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-red-500 hover:bg-red-500/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t("delete_profile")}
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-500">{t("delete_confirm")}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 text-red-500 hover:bg-red-500/15"
                onClick={handleDelete}
                disabled={isPending}
              >
                {t("delete_confirm_button")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
