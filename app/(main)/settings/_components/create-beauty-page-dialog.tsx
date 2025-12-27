"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { BeautyPageType } from "@/lib/queries";
import { Button, buttonVariants } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { Select } from "@/lib/ui/select";
import {
  createTranslatedBeautyPageNameSchema,
  createTranslatedBeautyPageSlugSchema,
} from "@/lib/validation/schemas";
import { createBeautyPage } from "../_actions";

type DialogStep = "intro" | "form";

interface CreateBeautyPageDialogProps {
  beautyPageTypes: BeautyPageType[];
}

export function CreateBeautyPageDialog({
  beautyPageTypes,
}: CreateBeautyPageDialogProps) {
  const t = useTranslations("settings");
  const tValidation = useTranslations("validation");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>("intro");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const formSchema = useMemo(() => {
    const nameSchema = createTranslatedBeautyPageNameSchema((key) =>
      tValidation(key),
    );
    const slugSchema = createTranslatedBeautyPageSlugSchema((key) =>
      tValidation(key),
    );
    return z.object({
      name: nameSchema,
      slug: slugSchema,
      typeId: z.string().uuid(tValidation("beauty_page_type_required")),
    });
  }, [tValidation]);

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      typeId: "",
    },
  });

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setStep("intro");
      setServerError(null);
      reset();
    }
  }

  function handleProceedToForm() {
    setStep("form");
  }

  function onSubmit(data: FormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await createBeautyPage({
        name: data.name,
        slug: data.slug,
        typeId: data.typeId,
      });

      if (result.success) {
        setOpen(false);
        router.push(`/${result.slug}`);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger className={buttonVariants({ variant: "secondary" })}>
        {t("create_beauty_page_button")}
      </Dialog.Trigger>

      <Dialog.Portal open={open} size="md">
        {step === "intro" ? (
          <>
            <Dialog.Header onClose={() => setOpen(false)}>
              {t("create_beauty_page_title")}
            </Dialog.Header>
            <Dialog.Body>
              <div className="space-y-4">
                <p className="text-">
                  {t("create_beauty_page_intro_description")}
                </p>
                <ul className="space-y-2 text-sm text-">
                  <li className="flex items-start gap-2">
                    <span className="text-">1.</span>
                    {t("create_beauty_page_intro_step1")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-">2.</span>
                    {t("create_beauty_page_intro_step2")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-">3.</span>
                    {t("create_beauty_page_intro_step3")}
                  </li>
                </ul>
              </div>
            </Dialog.Body>
            <Dialog.Footer className="justify-end">
              <Button onClick={handleProceedToForm}>
                {t("create_beauty_page_proceed")}
              </Button>
            </Dialog.Footer>
          </>
        ) : (
          <>
            <Dialog.Header onClose={() => setOpen(false)}>
              {t("create_beauty_page_form_title")}
            </Dialog.Header>
            <Dialog.Body>
              <form
                id="create-beauty-page-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <Field.Root>
                  <Field.Label>{t("beauty_page_name_label")}</Field.Label>
                  <Input
                    type="text"
                    placeholder={t("beauty_page_name_placeholder")}
                    state={errors.name ? "error" : "default"}
                    {...register("name")}
                  />
                  <Field.Error>{errors.name?.message}</Field.Error>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t("beauty_page_slug_label")}</Field.Label>
                  <Input
                    type="text"
                    placeholder={t("beauty_page_slug_placeholder")}
                    state={errors.slug ? "error" : "default"}
                    {...register("slug")}
                  />
                  <Field.Description>
                    {t("beauty_page_slug_hint")}
                  </Field.Description>
                  <Field.Error>{errors.slug?.message}</Field.Error>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t("beauty_page_type_label")}</Field.Label>
                  <Controller
                    name="typeId"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        items={beautyPageTypes.map((type) => ({
                          value: type.id,
                          label: type.name,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <Select.Trigger
                          placeholder={t("beauty_page_type_placeholder")}
                          state={errors.typeId ? "error" : "default"}
                        />
                        <Select.Content>
                          {beautyPageTypes.map((type) => (
                            <Select.Item key={type.id} value={type.id}>
                              {type.name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    )}
                  />
                  <Field.Error>{errors.typeId?.message}</Field.Error>
                </Field.Root>

                {serverError && <p className="text-sm text-">{serverError}</p>}
              </form>
            </Dialog.Body>
            <Dialog.Footer className="justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("intro")}
              >
                {t("back")}
              </Button>
              <Button
                type="submit"
                form="create-beauty-page-form"
                loading={isPending}
              >
                {t("create_beauty_page_submit")}
              </Button>
            </Dialog.Footer>
          </>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
