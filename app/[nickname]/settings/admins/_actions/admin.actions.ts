"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { sendInvitationEmail } from "@/lib/email/invitation";
import { hasPendingInvitation, isMemberByEmail } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type AuthorizationResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: string };

async function verifyCanManageAdmins(
  beautyPageId: string,
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const t = await getTranslations("admins");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: t("errors.not_authenticated") };
  }

  // Check if user is owner
  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", beautyPageId)
    .single();

  if (beautyPage?.owner_id === user.id) {
    return { authorized: true, userId: user.id };
  }

  // Check if user is admin
  const { data: member } = await supabase
    .from("beauty_page_members")
    .select("roles")
    .eq("beauty_page_id", beautyPageId)
    .eq("user_id", user.id)
    .single();

  if (member?.roles?.includes("admin")) {
    return { authorized: true, userId: user.id };
  }

  return { authorized: false, error: t("errors.not_authorized") };
}

/**
 * Add admin role to an existing member (specialist → admin+specialist)
 */
export async function addAdminRole(input: {
  memberId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("admins");

  const authorization = await verifyCanManageAdmins(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get current roles
  const { data: member } = await supabase
    .from("beauty_page_members")
    .select("roles")
    .eq("id", input.memberId)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!member) {
    return { success: false, error: t("errors.not_found") };
  }

  if (member.roles.includes("admin")) {
    return { success: false, error: t("errors.already_admin") };
  }

  const newRoles = [...member.roles, "admin"] as ("admin" | "specialist")[];

  const { error } = await supabase
    .from("beauty_page_members")
    .update({ roles: newRoles })
    .eq("id", input.memberId)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error adding admin role:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/admins`);
  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}

/**
 * Remove admin role from a member
 * - If member is admin+specialist → becomes specialist only
 * - If member is admin only → delete member entirely
 */
export async function removeAdminRole(input: {
  memberId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("admins");

  const authorization = await verifyCanManageAdmins(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get member info
  const { data: member } = await supabase
    .from("beauty_page_members")
    .select("user_id, roles")
    .eq("id", input.memberId)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!member) {
    return { success: false, error: t("errors.not_found") };
  }

  // Check if this is the owner
  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", input.beautyPageId)
    .single();

  if (beautyPage?.owner_id === member.user_id) {
    return { success: false, error: t("errors.cannot_remove_owner") };
  }

  const newRoles = member.roles.filter((r: string) => r !== "admin") as (
    | "admin"
    | "specialist"
  )[];

  if (newRoles.length === 0) {
    // Admin only - delete member entirely
    const { error } = await supabase
      .from("beauty_page_members")
      .delete()
      .eq("id", input.memberId)
      .eq("beauty_page_id", input.beautyPageId);

    if (error) {
      console.error("Error removing member:", error);
      return { success: false, error: t("errors.remove_failed") };
    }
  } else {
    // Admin specialist - just remove admin role
    const { error } = await supabase
      .from("beauty_page_members")
      .update({ roles: newRoles })
      .eq("id", input.memberId)
      .eq("beauty_page_id", input.beautyPageId);

    if (error) {
      console.error("Error updating member roles:", error);
      return { success: false, error: t("errors.update_failed") };
    }
  }

  revalidatePath(`/${input.nickname}/settings/admins`);
  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}

const inviteAdminSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

/**
 * Invite a new person as admin
 */
export async function inviteAdmin(input: {
  beautyPageId: string;
  email: string;
  nickname: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("admins");
  const tValidation = await getTranslations("validation");

  const validation = inviteAdminSchema.safeParse({ email: input.email });
  if (!validation.success) {
    return { success: false, error: tValidation("email_invalid") };
  }

  const authorization = await verifyCanManageAdmins(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  // Check if email is already a member
  const alreadyMember = await isMemberByEmail(
    input.beautyPageId,
    validation.data.email,
  );
  if (alreadyMember) {
    return { success: false, error: t("errors.already_member") };
  }

  // Check if there's already a pending invitation
  const hasPending = await hasPendingInvitation(
    input.beautyPageId,
    validation.data.email,
  );
  if (hasPending) {
    return { success: false, error: t("errors.already_invited") };
  }

  const supabase = await createClient();

  // Get beauty page info for the email
  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("name, slug")
    .eq("id", input.beautyPageId)
    .single();

  if (!beautyPage) {
    return { success: false, error: t("errors.not_found") };
  }

  // Get inviter name
  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", authorization.userId)
    .single();

  // Create invitation with admin role
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      beauty_page_id: input.beautyPageId,
      email: validation.data.email,
      roles: ["admin"],
      invited_by: authorization.userId,
    })
    .select("id, token")
    .single();

  if (error) {
    console.error("Error creating invitation:", error);
    return { success: false, error: t("errors.send_failed") };
  }

  // Send email
  try {
    await sendInvitationEmail({
      to: validation.data.email,
      inviterName: inviterProfile?.full_name ?? "Someone",
      beautyPageName: beautyPage.name,
      roles: ["admin"],
      token: data.token,
    });
  } catch (emailError) {
    // Delete the invitation if email fails
    console.error("Error sending invitation email:", emailError);
    await supabase.from("invitations").delete().eq("id", data.id);
    return { success: false, error: t("errors.email_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/admins`);

  return { success: true, data: { id: data.id } };
}

/**
 * Revoke an admin invitation
 */
export async function revokeAdminInvitation(input: {
  invitationId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("admins");

  const authorization = await verifyCanManageAdmins(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", input.invitationId)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error revoking invitation:", error);
    return { success: false, error: t("errors.revoke_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/admins`);

  return { success: true };
}
