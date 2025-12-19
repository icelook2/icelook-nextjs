"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { specialistWizardSchema } from "../schemas";
import type { SpecialistWizardData } from "../_lib/types";

type ActionResult =
  | { success: true; username: string }
  | { success: false; error: string };

/**
 * Creates a new specialist profile with services and contacts.
 */
export async function createSpecialist(
  data: SpecialistWizardData,
): Promise<ActionResult> {
  const t = await getTranslations("specialist.wizard");
  const tValidation = await getTranslations("validation");

  // Validate all data
  const validation = specialistWizardSchema.safeParse(data);

  if (!validation.success) {
    const issue = validation.error.issues[0];
    return { success: false, error: issue.message || tValidation("invalid_data") };
  }

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Check if user is already a specialist
  const { data: existingSpecialist } = await supabase
    .from("specialists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingSpecialist) {
    return { success: false, error: t("already_specialist") };
  }

  // Check if username is available
  const { data: existingUsername } = await supabase
    .from("specialists")
    .select("id")
    .eq("username", validation.data.profile.username)
    .single();

  if (existingUsername) {
    return { success: false, error: t("username_taken") };
  }

  // Create specialist
  const { data: specialist, error: specialistError } = await supabase
    .from("specialists")
    .insert({
      user_id: user.id,
      username: validation.data.profile.username,
      display_name: validation.data.profile.displayName,
      bio: validation.data.profile.bio || null,
      specialty: validation.data.profile.specialty,
    })
    .select("id, username")
    .single();

  if (specialistError || !specialist) {
    console.error("Failed to create specialist:", specialistError);
    return { success: false, error: t("creation_failed") };
  }

  // Create contacts (if any contact is provided)
  const contacts = validation.data.contacts;
  const hasAnyContact =
    contacts.instagram ||
    contacts.phone ||
    contacts.telegram ||
    contacts.viber ||
    contacts.whatsapp;

  if (hasAnyContact) {
    const { error: contactsError } = await supabase
      .from("specialist_contacts")
      .insert({
        specialist_id: specialist.id,
        instagram: contacts.instagram || null,
        phone: contacts.phone || null,
        telegram: contacts.telegram || null,
        viber: contacts.viber || null,
        whatsapp: contacts.whatsapp || null,
      });

    if (contactsError) {
      console.error("Failed to create contacts:", contactsError);
      // Don't fail the whole operation for contacts
    }
  }

  // Get the default service group (created by DB trigger)
  const { data: defaultGroup } = await supabase
    .from("service_groups")
    .select("id")
    .eq("specialist_id", specialist.id)
    .eq("is_default", true)
    .single();

  // Add services if any
  if (validation.data.services.length > 0 && defaultGroup) {
    const servicesToInsert = validation.data.services.map((service) => ({
      service_group_id: defaultGroup.id,
      name: service.name,
      price: service.price,
      currency: service.currency,
      duration_minutes: service.durationMinutes,
    }));

    const { error: servicesError } = await supabase
      .from("services")
      .insert(servicesToInsert);

    if (servicesError) {
      console.error("Failed to create services:", servicesError);
      // Don't fail the whole operation for services
    }
  }

  return { success: true, username: specialist.username };
}
