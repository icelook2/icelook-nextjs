import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ContactsSettingsForm } from "./_components/contacts-settings-form";

interface ContactsSettingsPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ContactsSettingsPage({
  params,
}: ContactsSettingsPageProps) {
  const { username: rawUsername } = await params;

  // Strip @ prefix if present
  const username = rawUsername.startsWith("@")
    ? rawUsername.slice(1)
    : rawUsername;

  const profile = await getProfile();
  if (!profile) {
    notFound();
  }

  const supabase = await createClient();

  const { data: specialist, error } = await supabase
    .from("specialists")
    .select(
      `
      id,
      username,
      specialist_contacts (
        instagram,
        phone,
        telegram,
        viber,
        whatsapp
      )
    `,
    )
    .eq("username", username)
    .eq("user_id", profile.id)
    .single();

  if (error || !specialist) {
    notFound();
  }

  const contacts = specialist.specialist_contacts?.[0] || {
    instagram: "",
    phone: "",
    telegram: "",
    viber: "",
    whatsapp: "",
  };

  return (
    <ContactsSettingsForm
      specialistId={specialist.id}
      initialData={{
        instagram: contacts.instagram || "",
        phone: contacts.phone || "",
        telegram: contacts.telegram || "",
        viber: contacts.viber || "",
        whatsapp: contacts.whatsapp || "",
      }}
    />
  );
}
