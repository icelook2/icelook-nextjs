import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { OrganizationHeader } from "./_components/organization-header";
import { OrganizationSalons } from "./_components/organization-salons";
import { ContactsSection } from "./_components/contacts-section";

interface OrganizationProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganizationProfilePage({
  params,
}: OrganizationProfilePageProps) {
  const { slug } = await params;
  const t = await getTranslations("organization.profile");

  const supabase = await createClient();

  // Fetch organization with contacts and salons
  const { data: organization, error } = await supabase
    .from("organizations")
    .select(
      `
      id,
      name,
      slug,
      description,
      is_active,
      business_contacts!business_contacts_organization_id_fkey (
        instagram,
        phone,
        telegram,
        viber,
        whatsapp
      ),
      salons (
        id,
        name,
        slug,
        city,
        is_active
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !organization) {
    notFound();
  }

  // Get current user for auth state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is owner/admin of this organization
  let isOwner = false;
  if (user) {
    const { data: ownership } = await supabase
      .from("business_owners")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", organization.id)
      .single();
    isOwner = !!ownership;
  }

  // Filter active salons
  const salons = (organization.salons || []).filter((s) => s.is_active);

  const contacts = organization.business_contacts?.[0] || null;

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <OrganizationHeader
          name={organization.name}
          slug={organization.slug}
          description={organization.description}
          isOwner={isOwner}
        />

        <OrganizationSalons
          salons={salons}
          title={t("salons_title")}
          emptyText={t("no_salons")}
        />

        <ContactsSection contacts={contacts} />
      </div>
    </div>
  );
}
