"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { nameSchema } from "../schemas";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Updates the user's profile name.
 */
export async function updateProfileName(name: string): Promise<ActionResult> {
  const t = await getTranslations("settings");
  const tValidation = await getTranslations("validation");

  const validation = nameSchema.safeParse(name);

  if (!validation.success) {
    const issue = validation.error.issues[0];
    if (issue.code === "too_small") {
      return { success: false, error: tValidation("name_too_short") };
    }
    if (issue.code === "too_big") {
      return { success: false, error: tValidation("name_too_long") };
    }
    return { success: false, error: tValidation("required") };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: validation.data })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: t("update_failed") };
  }

  revalidatePath("/settings");
  return { success: true };
}
