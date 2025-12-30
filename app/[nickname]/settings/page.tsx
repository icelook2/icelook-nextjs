import {
  Ban,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Scissors,
  Shield,
  Tag,
  UserCircle,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageAdmins, getBeautyPageByNickname } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { SettingsItem } from "@/lib/ui/settings-item";

interface BeautyPageSettingsProps {
  params: Promise<{ nickname: string }>;
}

export default async function BeautyPageSettings({
  params,
}: BeautyPageSettingsProps) {
  const { nickname } = await params;
  const t = await getTranslations("beauty_page_settings");

  const beautyPage = await getBeautyPageByNickname(nickname);

  if (!beautyPage) {
    notFound();
  }

  const profile = await getProfile();

  if (!profile) {
    redirect(`/${nickname}`);
  }

  // Check if user is owner or admin
  const isOwner = profile.id === beautyPage.owner_id;
  const admins = await getBeautyPageAdmins(beautyPage.id);
  const userIsAdmin = admins.some((a) => a.user_id === profile.id);

  if (!isOwner && !userIsAdmin) {
    redirect(`/${nickname}`);
  }

  const servicesLinks = [
    {
      href: `/${nickname}/settings/service-groups`,
      icon: Scissors,
      title: t("nav.services"),
      description: t("nav.services_description"),
      iconClassName:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
      disabled: false,
    },
  ];

  const peopleLinks = [
    {
      href: `/${nickname}/settings/admins`,
      icon: Shield,
      title: t("nav.admins"),
      description: t("nav.admins_description"),
      iconClassName:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
      disabled: false,
    },
    {
      href: `/${nickname}/settings/specialists`,
      icon: UserCircle,
      title: t("nav.specialists"),
      description: t("nav.specialists_description"),
      iconClassName:
        "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
      disabled: false,
    },
    {
      href: `/${nickname}/settings/labels`,
      icon: Tag,
      title: t("nav.labels"),
      description: t("nav.labels_description"),
      iconClassName:
        "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400",
      disabled: false,
    },
  ];

  const operationsLinks = [
    {
      href: `/${nickname}/settings/contact`,
      icon: MapPin,
      title: t("nav.contact"),
      description: t("nav.contact_description"),
      iconClassName:
        "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
      disabled: false,
    },
    {
      href: `/${nickname}/settings/business-hours`,
      icon: Clock,
      title: t("nav.business_hours"),
      description: t("nav.business_hours_description"),
      iconClassName:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      disabled: false,
    },
    {
      href: `/${nickname}/settings/cancellation-policy`,
      icon: Ban,
      title: t("nav.cancellation_policy"),
      description: t("nav.cancellation_policy_description"),
      iconClassName:
        "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
      disabled: false,
    },
    {
      href: `/${nickname}/settings/schedule`,
      icon: Calendar,
      title: t("nav.schedule"),
      description: t("nav.schedule_description"),
      iconClassName:
        "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
      disabled: true,
    },
    {
      href: `/${nickname}/settings/billing`,
      icon: CreditCard,
      title: t("nav.billing"),
      description: t("nav.billing_description"),
      iconClassName:
        "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-400",
      disabled: true,
    },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={beautyPage.name}
        backHref={`/${nickname}`}
        containerClassName="mx-auto max-w-2xl"
      />

      <main className="mx-auto max-w-2xl px-4 pb-8">
        <div className="space-y-6">
          {/* Services */}
          <SettingsGroup title={t("groups.services")}>
            {servicesLinks.map((link) => (
              <SettingsItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                title={link.title}
                description={link.description}
                iconClassName={link.iconClassName}
                variant="grouped"
                noBorder
                disabled={link.disabled}
              />
            ))}
          </SettingsGroup>

          {/* People Management */}
          <SettingsGroup title={t("groups.people")}>
            {peopleLinks.map((link, index) => (
              <SettingsItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                title={link.title}
                description={link.description}
                iconClassName={link.iconClassName}
                variant="grouped"
                noBorder={index === peopleLinks.length - 1}
                disabled={link.disabled}
              />
            ))}
          </SettingsGroup>

          {/* Operations */}
          <SettingsGroup title={t("groups.operations")}>
            {operationsLinks.map((link, index) => (
              <SettingsItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                title={link.title}
                description={link.description}
                iconClassName={link.iconClassName}
                variant="grouped"
                noBorder={index === operationsLinks.length - 1}
                disabled={link.disabled}
              />
            ))}
          </SettingsGroup>
        </div>
      </main>
    </>
  );
}
