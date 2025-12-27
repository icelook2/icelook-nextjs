"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { updateAddress, updateSocialMedia } from "../_actions/contact.actions";

// ============================================================================
// Address Form
// ============================================================================

interface AddressFormValues {
  address: string;
  city: string;
  postal_code: string;
}

interface AddressFormProps {
  beautyPageId: string;
  nickname: string;
  initialValues: {
    address: string | null;
    city: string | null;
    postal_code: string | null;
  };
}

export function AddressForm({
  beautyPageId,
  nickname,
  initialValues,
}: AddressFormProps) {
  const t = useTranslations("contact_settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<AddressFormValues>({
    defaultValues: {
      address: initialValues.address ?? "",
      city: initialValues.city ?? "",
      postal_code: initialValues.postal_code ?? "",
    },
  });

  function onSubmit(data: AddressFormValues) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateAddress({
        beautyPageId,
        nickname,
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
      });

      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setServerError(result.error ?? null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsGroup
        title={t("address.title")}
        description={t("address.description")}
      >
        <SettingsRow>
          <div className="space-y-4">
            <Field.Root name="address">
              <Field.Label>{t("address.street_label")}</Field.Label>
              <Input
                {...register("address")}
                placeholder={t("address.street_placeholder")}
              />
            </Field.Root>

            <div className="grid grid-cols-2 gap-4">
              <Field.Root name="city">
                <Field.Label>{t("address.city_label")}</Field.Label>
                <Input
                  {...register("city")}
                  placeholder={t("address.city_placeholder")}
                />
              </Field.Root>

              <Field.Root name="postal_code">
                <Field.Label>{t("address.postal_code_label")}</Field.Label>
                <Input
                  {...register("postal_code")}
                  placeholder={t("address.postal_code_placeholder")}
                />
              </Field.Root>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button
                type="submit"
                disabled={isPending || !isDirty}
                loading={isPending}
              >
                {t("save")}
              </Button>
              {serverError && (
                <p className="text-sm text-danger">{serverError}</p>
              )}
              {success && <p className="text-sm text-success">{t("saved")}</p>}
            </div>
          </div>
        </SettingsRow>
      </SettingsGroup>
    </form>
  );
}

// ============================================================================
// Social Media Form
// ============================================================================

interface SocialMediaFormValues {
  instagram_url: string;
}

interface SocialMediaFormProps {
  beautyPageId: string;
  nickname: string;
  initialValues: {
    instagram_url: string | null;
  };
}

export function SocialMediaForm({
  beautyPageId,
  nickname,
  initialValues,
}: SocialMediaFormProps) {
  const t = useTranslations("contact_settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<SocialMediaFormValues>({
    defaultValues: {
      instagram_url: initialValues.instagram_url ?? "",
    },
  });

  function onSubmit(data: SocialMediaFormValues) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateSocialMedia({
        beautyPageId,
        nickname,
        instagram_url: data.instagram_url || null,
      });

      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setServerError(result.error ?? null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsGroup
        title={t("social.title")}
        description={t("social.description")}
      >
        <SettingsRow>
          <div className="space-y-4">
            <Field.Root name="instagram_url">
              <Field.Label>{t("social.instagram_label")}</Field.Label>
              <Input
                {...register("instagram_url")}
                placeholder={t("social.instagram_placeholder")}
              />
              <Field.Description>
                {t("social.instagram_description")}
              </Field.Description>
            </Field.Root>

            <div className="flex items-center gap-4 pt-2">
              <Button
                type="submit"
                disabled={isPending || !isDirty}
                loading={isPending}
              >
                {t("save")}
              </Button>
              {serverError && (
                <p className="text-sm text-danger">{serverError}</p>
              )}
              {success && <p className="text-sm text-success">{t("saved")}</p>}
            </div>
          </div>
        </SettingsRow>
      </SettingsGroup>
    </form>
  );
}
