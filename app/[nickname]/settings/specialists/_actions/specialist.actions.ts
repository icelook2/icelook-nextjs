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

async function verifyCanManageSpecialists(
  beautyPageId: string,
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const t = await getTranslations("specialists");

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
 * Add specialist role to an existing member (admin → admin+specialist)
 * Also creates the specialist profile
 */
export async function addSpecialistRole(input: {
  memberId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult<{ profileId: string }>> {
  const t = await getTranslations("specialists");

  const authorization = await verifyCanManageSpecialists(input.beautyPageId);
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

  if (member.roles.includes("specialist")) {
    return { success: false, error: t("errors.already_specialist") };
  }

  const newRoles = [...member.roles, "specialist"] as (
    | "admin"
    | "specialist"
  )[];

  // Update roles
  const { error: roleError } = await supabase
    .from("beauty_page_members")
    .update({ roles: newRoles })
    .eq("id", input.memberId)
    .eq("beauty_page_id", input.beautyPageId);

  if (roleError) {
    console.error("Error adding specialist role:", roleError);
    return { success: false, error: t("errors.update_failed") };
  }

  // Create specialist profile
  const { data: profile, error: profileError } = await supabase
    .from("beauty_page_specialist_profiles")
    .insert({ member_id: input.memberId })
    .select("id")
    .single();

  if (profileError) {
    console.error("Error creating specialist profile:", profileError);
    // Rollback the role change
    await supabase
      .from("beauty_page_members")
      .update({ roles: member.roles })
      .eq("id", input.memberId);
    return { success: false, error: t("errors.create_profile_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);
  revalidatePath(`/${input.nickname}/settings/admins`);

  return { success: true, data: { profileId: profile.id } };
}

/**
 * Remove specialist role from a member
 * - If member is admin+specialist → becomes admin only, deletes profile
 * - If member is specialist only → delete member entirely (cascades profile)
 */
export async function removeSpecialistRole(input: {
  memberId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("specialists");

  const authorization = await verifyCanManageSpecialists(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get member info
  const { data: member } = await supabase
    .from("beauty_page_members")
    .select("roles")
    .eq("id", input.memberId)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!member) {
    return { success: false, error: t("errors.not_found") };
  }

  const newRoles = member.roles.filter((r: string) => r !== "specialist") as (
    | "admin"
    | "specialist"
  )[];

  if (newRoles.length === 0) {
    // Specialist only - delete member entirely (cascades profile assignments)
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
    // Admin specialist - delete profile first (cascades assignments), then update roles
    const { error: profileError } = await supabase
      .from("beauty_page_specialist_profiles")
      .delete()
      .eq("member_id", input.memberId);

    if (profileError) {
      console.error("Error deleting specialist profile:", profileError);
      return { success: false, error: t("errors.remove_failed") };
    }

    const { error: roleError } = await supabase
      .from("beauty_page_members")
      .update({ roles: newRoles })
      .eq("id", input.memberId)
      .eq("beauty_page_id", input.beautyPageId);

    if (roleError) {
      console.error("Error updating member roles:", roleError);
      return { success: false, error: t("errors.update_failed") };
    }
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);
  revalidatePath(`/${input.nickname}/settings/admins`);
  revalidatePath(`/${input.nickname}/settings/services`);

  return { success: true };
}

const profileUpdateSchema = z.object({
  displayName: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Update specialist profile details
 */
export async function updateSpecialistProfile(input: {
  profileId: string;
  beautyPageId: string;
  displayName?: string | null;
  bio?: string | null;
  isActive?: boolean;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("specialists");

  const validation = profileUpdateSchema.safeParse({
    displayName: input.displayName,
    bio: input.bio,
    isActive: input.isActive,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  const authorization = await verifyCanManageSpecialists(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (validation.data.displayName !== undefined) {
    updateData.display_name = validation.data.displayName || null;
  }
  if (validation.data.bio !== undefined) {
    updateData.bio = validation.data.bio || null;
  }
  if (validation.data.isActive !== undefined) {
    updateData.is_active = validation.data.isActive;
  }

  const { error } = await supabase
    .from("beauty_page_specialist_profiles")
    .update(updateData)
    .eq("id", input.profileId);

  if (error) {
    console.error("Error updating specialist profile:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);
  revalidatePath(`/${input.nickname}/settings/specialists/${input.profileId}`);

  return { success: true };
}

const inviteSpecialistSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

/**
 * Invite a new person as specialist
 */
export async function inviteSpecialist(input: {
  beautyPageId: string;
  email: string;
  nickname: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("specialists");
  const tValidation = await getTranslations("validation");

  const validation = inviteSpecialistSchema.safeParse({ email: input.email });
  if (!validation.success) {
    return { success: false, error: tValidation("email_invalid") };
  }

  const authorization = await verifyCanManageSpecialists(input.beautyPageId);
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

  // Create invitation with specialist role
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      beauty_page_id: input.beautyPageId,
      email: validation.data.email,
      roles: ["specialist"],
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
      roles: ["specialist"],
      token: data.token,
    });
  } catch (emailError) {
    // Delete the invitation if email fails
    console.error("Error sending invitation email:", emailError);
    await supabase.from("invitations").delete().eq("id", data.id);
    return { success: false, error: t("errors.email_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true, data: { id: data.id } };
}

/**
 * Revoke a specialist invitation
 */
export async function revokeSpecialistInvitation(input: {
  invitationId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("specialists");

  const authorization = await verifyCanManageSpecialists(input.beautyPageId);
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

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}
