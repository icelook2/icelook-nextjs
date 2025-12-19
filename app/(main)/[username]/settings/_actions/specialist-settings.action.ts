"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Specialty, Currency } from "@/app/(main)/settings/become-specialist/_lib/types";

type ActionResult<T = void> =
  | { success: true } & (T extends void ? object : { [K in keyof T]: T[K] })
  | { success: false; error: string };

interface UpdateProfileData {
  displayName: string;
  bio: string;
  specialty: Specialty;
  username: string;
  isActive: boolean;
}

export async function updateSpecialistProfile(
  specialistId: string,
  data: UpdateProfileData,
): Promise<ActionResult<{ username: string }>> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  // Check username availability if changed
  if (data.username !== existing.username) {
    const { data: usernameCheck } = await supabase
      .from("specialists")
      .select("id")
      .eq("username", data.username)
      .neq("id", specialistId)
      .single();

    if (usernameCheck) {
      return { success: false, error: "Username already taken" };
    }
  }

  const { error } = await supabase
    .from("specialists")
    .update({
      display_name: data.displayName,
      bio: data.bio || null,
      specialty: data.specialty,
      username: data.username,
      is_active: data.isActive,
    })
    .eq("id", specialistId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${data.username}`);
  revalidatePath(`/@${existing.username}`);

  return { success: true, username: data.username };
}

export async function deactivateSpecialist(
  specialistId: string,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  const { error } = await supabase
    .from("specialists")
    .update({ is_active: false })
    .eq("id", specialistId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true };
}

export async function deleteSpecialist(
  specialistId: string,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  // Delete specialist (cascade will handle related data)
  const { error } = await supabase
    .from("specialists")
    .delete()
    .eq("id", specialistId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true };
}

interface UpdateContactsData {
  instagram: string;
  phone: string;
  telegram: string;
  viber: string;
  whatsapp: string;
}

export async function updateSpecialistContacts(
  specialistId: string,
  data: UpdateContactsData,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  // Upsert contacts
  const { error } = await supabase.from("specialist_contacts").upsert(
    {
      specialist_id: specialistId,
      instagram: data.instagram || null,
      phone: data.phone || null,
      telegram: data.telegram || null,
      viber: data.viber || null,
      whatsapp: data.whatsapp || null,
    },
    {
      onConflict: "specialist_id",
    },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true };
}

interface ServiceGroupData {
  id?: string;
  name: string;
}

export async function createServiceGroup(
  specialistId: string,
  data: ServiceGroupData,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  const { data: group, error } = await supabase
    .from("service_groups")
    .insert({
      specialist_id: specialistId,
      name: data.name,
      is_default: false,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true, id: group.id };
}

export async function updateServiceGroup(
  specialistId: string,
  groupId: string,
  data: { name: string },
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership through specialist
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  const { error } = await supabase
    .from("service_groups")
    .update({ name: data.name })
    .eq("id", groupId)
    .eq("specialist_id", specialistId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true };
}

export async function deleteServiceGroup(
  specialistId: string,
  groupId: string,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership and check it's not default
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  const { data: group } = await supabase
    .from("service_groups")
    .select("is_default")
    .eq("id", groupId)
    .single();

  if (group?.is_default) {
    return { success: false, error: "Cannot delete default group" };
  }

  // Move services to default group first
  const { data: defaultGroup } = await supabase
    .from("service_groups")
    .select("id")
    .eq("specialist_id", specialistId)
    .eq("is_default", true)
    .single();

  if (defaultGroup) {
    await supabase
      .from("services")
      .update({ group_id: defaultGroup.id })
      .eq("group_id", groupId);
  }

  const { error } = await supabase
    .from("service_groups")
    .delete()
    .eq("id", groupId)
    .eq("specialist_id", specialistId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true };
}

interface ServiceData {
  name: string;
  price: number;
  currency: Currency;
  durationMinutes: number;
  isActive?: boolean;
}

export async function createService(
  specialistId: string,
  groupId: string,
  data: ServiceData,
): Promise<ActionResult<{ id: string }>> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  const { data: service, error } = await supabase
    .from("services")
    .insert({
      group_id: groupId,
      name: data.name,
      price: data.price,
      currency: data.currency,
      duration_minutes: data.durationMinutes,
      is_active: data.isActive ?? true,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true, id: service.id };
}

export async function updateService(
  specialistId: string,
  serviceId: string,
  data: Partial<ServiceData>,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  // Verify service belongs to specialist's group
  const { data: service } = await supabase
    .from("services")
    .select("group_id, service_groups!inner(specialist_id)")
    .eq("id", serviceId)
    .single();

  const serviceGroup = service?.service_groups as unknown as { specialist_id: string } | undefined;
  if (!service || serviceGroup?.specialist_id !== specialistId) {
    return { success: false, error: "Not found" };
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) { updateData.name = data.name; }
  if (data.price !== undefined) { updateData.price = data.price; }
  if (data.currency !== undefined) { updateData.currency = data.currency; }
  if (data.durationMinutes !== undefined) { updateData.duration_minutes = data.durationMinutes; }
  if (data.isActive !== undefined) { updateData.is_active = data.isActive; }

  const { error } = await supabase
    .from("services")
    .update(updateData)
    .eq("id", serviceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true };
}

export async function deleteService(
  specialistId: string,
  serviceId: string,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("specialists")
    .select("user_id, username")
    .eq("id", specialistId)
    .single();

  if (!existing || existing.user_id !== profile.id) {
    return { success: false, error: "Not found" };
  }

  // Verify service belongs to specialist
  const { data: service } = await supabase
    .from("services")
    .select("group_id, service_groups!inner(specialist_id)")
    .eq("id", serviceId)
    .single();

  const serviceGroup = service?.service_groups as unknown as { specialist_id: string } | undefined;
  if (!service || serviceGroup?.specialist_id !== specialistId) {
    return { success: false, error: "Not found" };
  }

  const { error } = await supabase.from("services").delete().eq("id", serviceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/@${existing.username}`);

  return { success: true };
}
