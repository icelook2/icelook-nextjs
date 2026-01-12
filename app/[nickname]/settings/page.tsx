import {
  Ban,
  BarChart3,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Scissors,
  Tag,
  Users,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
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

  // Solo creator model: only owner can access settings
  const isOwner = profile.id === beautyPage.owner_id;

  if (!isOwner) {
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
    {
      href: `/${nickname}/settings/special-offers`,
      icon: Tag,
      title: t("nav.special_offers"),
      description: t("nav.special_offers_description"),
      iconClassName:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      disabled: false,
    },
  ];

  const scheduleLinks = [
    {
      href: `/${nickname}/appointments`,
      icon: Calendar,
      title: t("nav.schedule"),
      description: t("nav.schedule_description"),
      iconClassName:
        "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
      disabled: false,
    },
    {
      href: `/${nickname}/settings/time-settings`,
      icon: Clock,
      title: t("nav.time_settings"),
      description: t("nav.time_settings_description"),
      iconClassName:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
      disabled: false,
    },
  ];

  const operationsLinks = [
    {
      href: `/${nickname}/settings/analytics`,
      icon: BarChart3,
      title: t("nav.analytics"),
      description: t("nav.analytics_description"),
      iconClassName:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      disabled: false,
    },
    {
      href: `/${nickname}/settings/clients`,
      icon: Users,
      title: t("nav.clients"),
      description: t("nav.clients_description"),
      iconClassName:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
      disabled: false,
    },
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
      href: `/${nickname}/settings/cancellation-policy`,
      icon: Ban,
      title: t("nav.cancellation_policy"),
      description: t("nav.cancellation_policy_description"),
      iconClassName:
        "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
      disabled: false,
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
            {servicesLinks.map((link, index) => (
              <SettingsItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                title={link.title}
                description={link.description}
                iconClassName={link.iconClassName}
                variant="grouped"
                noBorder={index === servicesLinks.length - 1}
                disabled={link.disabled}
              />
            ))}
          </SettingsGroup>

          {/* Schedule */}
          <SettingsGroup title={t("groups.schedule")}>
            {scheduleLinks.map((link, index) => (
              <SettingsItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                title={link.title}
                description={link.description}
                iconClassName={link.iconClassName}
                variant="grouped"
                noBorder={index === scheduleLinks.length - 1}
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
