"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
 | { success: true; data?: T }
 | { success: false; error: string };

export async function acceptInvitation(
 invitationId: string,
): Promise<ActionResult> {
 const t = await getTranslations("invite");
 const supabase = await createClient();

 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 return { success: false, error: t("errors.not_authenticated") };
 }

 const { error } = await supabase.rpc("accept_invitation", {
 invitation_id: invitationId,
 });

 if (error) {
 console.error("Error accepting invitation:", error);
 return { success: false, error: t("errors.accept_failed") };
 }

 revalidatePath("/settings/invitations");
 revalidatePath("/beauty-pages");

 return { success: true };
}

export async function declineInvitation(
 invitationId: string,
): Promise<ActionResult> {
 const t = await getTranslations("invite");
 const supabase = await createClient();

 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 return { success: false, error: t("errors.not_authenticated") };
 }

 const { error } = await supabase.rpc("decline_invitation", {
 invitation_id: invitationId,
 });

 if (error) {
 console.error("Error declining invitation:", error);
 return { success: false, error: t("errors.decline_failed") };
 }

 revalidatePath("/settings/invitations");

 return { success: true };
}
