"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationWizardSchema } from "../schemas";
import type { OrganizationWizardData } from "../_lib/types";

type ActionResult =
  | { success: true; slug: string }
  | { success: false; error: string };

/**
 * Creates a new organization with contacts.
 */
export async function createOrganization(
  data: OrganizationWizardData,
): Promise<ActionResult> {
  const t = await getTranslations("business.wizard");
  const tValidation = await getTranslations("validation");

  // Validate all data
  const validation = createOrganizationWizardSchema.safeParse(data);

  if (!validation.success) {
    const issue = validation.error.issues[0];
    return {
      success: false,
      error: issue.message || tValidation("invalid_data"),
    };
  }

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: t("not_authenticated") };
  }

  // Check if slug is available
  const { data: existingSlug } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", validation.data.profile.slug)
    .single();

  if (existingSlug) {
    return { success: false, error: t("slug_taken") };
  }

  // Create organization (owner_id triggers auto-creation of organization_members and organization_contacts)
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .insert({
      owner_id: user.id,
      name: validation.data.profile.name,
      slug: validation.data.profile.slug,
      description: validation.data.profile.description || null,
    })
    .select("id, slug")
    .single();

  if (orgError || !organization) {
    console.error("Failed to create organization:", orgError);
    return { success: false, error: t("creation_failed") };
  }

  // Note: organization_members entry with 'owner' role is auto-created by database trigger
  // Note: organization_contacts entry is auto-created by database trigger

  // Update contacts (if any contact is provided)
  const contacts = validation.data.contacts;
  const hasAnyContact =
    contacts.instagram ||
    contacts.phone ||
    contacts.telegram ||
    contacts.viber ||
    contacts.whatsapp;

  if (hasAnyContact) {
    const { error: contactsError } = await supabase
      .from("organization_contacts")
      .update({
        instagram: contacts.instagram || null,
        phone: contacts.phone || null,
        telegram: contacts.telegram || null,
        viber: contacts.viber || null,
        whatsapp: contacts.whatsapp || null,
      })
      .eq("organization_id", organization.id);

    if (contactsError) {
      console.error("Failed to update contacts:", contactsError);
      // Don't fail the whole operation for contacts
    }
  }

  return { success: true, slug: organization.slug };
}
