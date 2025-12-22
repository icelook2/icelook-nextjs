"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { SpecialistWithMember } from "@/lib/queries/specialists";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { Textarea } from "@/lib/ui/textarea";
import { updateSpecialistProfile } from "../../../_actions";

interface ProfileFormProps {
  specialist: SpecialistWithMember;
  beautyPageId: string;
  nickname: string;
}

export function ProfileForm({
  specialist,
  beautyPageId,
  nickname,
}: ProfileFormProps) {
  const t = useTranslations("specialists");
  const userProfile = specialist.beauty_page_members.profiles;

  return (
    <div className="space-y-6">
      {/* Display Name Section */}
      <DisplayNameSection
        specialistId={specialist.id}
        currentValue={specialist.display_name ?? ""}
        placeholder={userProfile?.full_name ?? t("display_name_placeholder")}
        beautyPageId={beautyPageId}
        nickname={nickname}
      />

      {/* Bio Section */}
      <BioSection
        specialistId={specialist.id}
        currentValue={specialist.bio ?? ""}
        beautyPageId={beautyPageId}
        nickname={nickname}
      />
    </div>
  );
}

interface DisplayNameSectionProps {
  specialistId: string;
  currentValue: string;
  placeholder: string;
  beautyPageId: string;
  nickname: string;
}

function DisplayNameSection({
  specialistId,
  currentValue,
  placeholder,
  beautyPageId,
  nickname,
}: DisplayNameSectionProps) {
  const t = useTranslations("specialists");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<{ displayName: string }>({
    defaultValues: {
      displayName: currentValue,
    },
  });

  function onSubmit(data: { displayName: string }) {
    setServerError(null);

    startTransition(async () => {
      const result = await updateSpecialistProfile({
        profileId: specialistId,
        beautyPageId,
        displayName: data.displayName || null,
        nickname,
      });

      if (result.success) {
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <SettingsGroup title={t("display_name_label")}>
      <SettingsRow noBorder>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field.Root>
            <Field.Label>{t("display_name_label")}</Field.Label>
            <Input placeholder={placeholder} {...register("displayName")} />
            <Field.Description>{t("display_name_hint")}</Field.Description>
          </Field.Root>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" variant="primary" loading={isPending} size="sm">
            {t("save")}
          </Button>
        </form>
      </SettingsRow>
    </SettingsGroup>
  );
}

interface BioSectionProps {
  specialistId: string;
  currentValue: string;
  beautyPageId: string;
  nickname: string;
}

function BioSection({
  specialistId,
  currentValue,
  beautyPageId,
  nickname,
}: BioSectionProps) {
  const t = useTranslations("specialists");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<{ bio: string }>({
    defaultValues: {
      bio: currentValue,
    },
  });

  function onSubmit(data: { bio: string }) {
    setServerError(null);

    startTransition(async () => {
      const result = await updateSpecialistProfile({
        profileId: specialistId,
        beautyPageId,
        bio: data.bio || null,
        nickname,
      });

      if (result.success) {
        router.refresh();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <SettingsGroup title={t("bio_label")}>
      <SettingsRow noBorder>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field.Root>
            <Field.Label>{t("bio_label")}</Field.Label>
            <Textarea
              rows={4}
              placeholder={t("bio_placeholder")}
              {...register("bio")}
            />
            <Field.Description>{t("bio_hint")}</Field.Description>
          </Field.Root>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" variant="primary" loading={isPending} size="sm">
            {t("save")}
          </Button>
        </form>
      </SettingsRow>
    </SettingsGroup>
  );
}
