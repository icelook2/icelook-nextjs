"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createSalonWizardSchema } from "../schemas";
import type { SalonWizardData } from "../_lib/types";

type ActionResult =
  | { success: true; slug: string }
  | { success: false; error: string };

/**
 * Creates a new salon with address and contacts.
 */
export async function createSalon(
  data: SalonWizardData,
): Promise<ActionResult> {
  const t = await getTranslations("business.wizard");
  const tValidation = await getTranslations("validation");

  // Validate all data
  const validation = createSalonWizardSchema.safeParse(data);

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
    .from("salons")
    .select("id")
    .eq("slug", validation.data.profile.slug)
    .single();

  if (existingSlug) {
    return { success: false, error: t("slug_taken") };
  }

  // Determine ownership: if organization_id is provided, salon belongs to org; otherwise it's independent
  const isOrganizationSalon = !!validation.data.organization_id;

  // Create salon (owner_id triggers auto-creation of salon_members and salon_contacts)
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .insert({
      organization_id: isOrganizationSalon ? validation.data.organization_id : null,
      owner_id: isOrganizationSalon ? null : user.id,
      name: validation.data.profile.name,
      slug: validation.data.profile.slug,
      description: validation.data.profile.description || null,
      address_line1: validation.data.address.address_line1,
      address_line2: validation.data.address.address_line2 || null,
      city: validation.data.address.city,
      state: validation.data.address.state || null,
      postal_code: validation.data.address.postal_code || null,
      country: validation.data.address.country,
    })
    .select("id, slug")
    .single();

  if (salonError || !salon) {
    console.error("Failed to create salon:", JSON.stringify(salonError, null, 2));
    return { success: false, error: t("creation_failed") };
  }

  // Note: salon_members entry with 'owner' role is auto-created by trigger (for independent salons)
  // Note: salon_contacts entry is auto-created by database trigger

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
      .from("salon_contacts")
      .update({
        instagram: contacts.instagram || null,
        phone: contacts.phone || null,
        telegram: contacts.telegram || null,
        viber: contacts.viber || null,
        whatsapp: contacts.whatsapp || null,
      })
      .eq("salon_id", salon.id);

    if (contactsError) {
      console.error("Failed to update contacts:", contactsError);
      // Don't fail the whole operation for contacts
    }
  }

  return { success: true, slug: salon.slug };
}
