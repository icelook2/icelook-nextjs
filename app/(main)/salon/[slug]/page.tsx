import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SalonHeader } from "./_components/salon-header";
import { SalonSpecialists } from "./_components/salon-specialists";
import { ContactsSection } from "./_components/contacts-section";
import { AddressSection } from "./_components/address-section";

interface SalonProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SalonProfilePage({
  params,
}: SalonProfilePageProps) {
  const { slug } = await params;
  const t = await getTranslations("salon.profile");

  const supabase = await createClient();

  // Fetch salon with contacts and specialists
  const { data: salon, error } = await supabase
    .from("salons")
    .select(
      `
      id,
      organization_id,
      name,
      slug,
      description,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_active,
      business_contacts!business_contacts_salon_id_fkey (
        instagram,
        phone,
        telegram,
        viber,
        whatsapp
      ),
      salon_specialists (
        specialist:specialists (
          id,
          username,
          display_name,
          specialty,
          is_active
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !salon) {
    notFound();
  }

  // Get current user for auth state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is owner/admin of this salon
  let isOwner = false;
  if (user) {
    const { data: ownership } = await supabase
      .from("business_owners")
      .select("id")
      .eq("user_id", user.id)
      .eq("salon_id", salon.id)
      .single();
    isOwner = !!ownership;
  }

  // Format specialists list - filter active specialists
  // Supabase returns specialist as array due to join, so we flatMap and filter
  const specialists = (salon.salon_specialists || [])
    .flatMap((ss) => ss.specialist || [])
    .filter((s) => s.is_active)
    .map((s) => ({
      id: s.id as string,
      username: s.username as string,
      display_name: s.display_name as string,
      specialty: s.specialty as string | null,
    }));

  const contacts = salon.business_contacts?.[0] || null;

  const address = {
    address_line1: salon.address_line1,
    address_line2: salon.address_line2,
    city: salon.city,
    state: salon.state,
    postal_code: salon.postal_code,
    country: salon.country,
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <SalonHeader
          name={salon.name}
          slug={salon.slug}
          description={salon.description}
          isOwner={isOwner}
        />

        <AddressSection address={address} />

        <SalonSpecialists
          specialists={specialists}
          title={t("specialists_title")}
          emptyText={t("no_specialists")}
        />

        <ContactsSection contacts={contacts} />
      </div>
    </div>
  );
}
