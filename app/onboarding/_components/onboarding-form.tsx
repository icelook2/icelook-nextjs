"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { Input } from "@/lib/ui/input";
import { updateProfile } from "../actions";
import { createTranslatedNameSchema } from "../schemas";

export function OnboardingForm() {
 const t = useTranslations("onboarding");
 const tValidation = useTranslations("validation");
 const [isPending, startTransition] = useTransition();
 const [serverError, setServerError] = useState<string | null>(null);

 const formSchema = useMemo(() => {
 const nameSchema = createTranslatedNameSchema((key) => tValidation(key));
 return z.object({ name: nameSchema });
 }, [tValidation]);

 type FormData = z.infer<typeof formSchema>;

 const {
 register,
 handleSubmit,
 formState: { errors },
 } = useForm<FormData>({
 resolver: zodResolver(formSchema),
 });

 function onSubmit(data: FormData) {
 setServerError(null);

 startTransition(async () => {
 const result = await updateProfile(data.name);
 // Only reaches here on error (redirect throws on success)
 if (!result.success) {
 setServerError(result.error);
 }
 });
 }

 const error = errors.name?.message || serverError;

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 <Field.Root>
 <Field.Label>{t("name_label")}</Field.Label>
 <Input
 type="text"
 placeholder={t("name_placeholder")}
 autoComplete="name"
 autoFocus
 state={error ? "error" : "default"}
 {...register("name")}
 />
 <Field.Error>{error}</Field.Error>
 </Field.Root>

 <Button type="submit" loading={isPending} className="w-full">
 {t("continue")}
 </Button>
 </form>
 );
}
