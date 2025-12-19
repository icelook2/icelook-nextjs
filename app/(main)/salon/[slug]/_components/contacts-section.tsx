import { useTranslations } from "next-intl";
import { Instagram, Phone, Send, MessageCircle } from "lucide-react";

interface ContactsSectionProps {
  contacts: {
    instagram: string | null;
    phone: string | null;
    telegram: string | null;
    viber: string | null;
    whatsapp: string | null;
  } | null;
}

export function ContactsSection({ contacts }: ContactsSectionProps) {
  const t = useTranslations("salon.profile");

  if (!contacts) {
    return null;
  }

  const hasAnyContact =
    contacts.instagram ||
    contacts.phone ||
    contacts.telegram ||
    contacts.viber ||
    contacts.whatsapp;

  if (!hasAnyContact) {
    return null;
  }

  const contactItems = [
    {
      key: "instagram",
      value: contacts.instagram,
      icon: Instagram,
      href: contacts.instagram
        ? `https://instagram.com/${contacts.instagram.replace("@", "")}`
        : null,
      label: contacts.instagram,
    },
    {
      key: "phone",
      value: contacts.phone,
      icon: Phone,
      href: contacts.phone ? `tel:${contacts.phone.replace(/\s/g, "")}` : null,
      label: contacts.phone,
    },
    {
      key: "telegram",
      value: contacts.telegram,
      icon: Send,
      href: contacts.telegram
        ? `https://t.me/${contacts.telegram.replace("@", "")}`
        : null,
      label: contacts.telegram,
    },
    {
      key: "viber",
      value: contacts.viber,
      icon: MessageCircle,
      href: contacts.viber
        ? `viber://chat?number=${contacts.viber.replace(/\s/g, "").replace("+", "%2B")}`
        : null,
      label: contacts.viber,
    },
    {
      key: "whatsapp",
      value: contacts.whatsapp,
      icon: MessageCircle,
      href: contacts.whatsapp
        ? `https://wa.me/${contacts.whatsapp.replace(/\s/g, "").replace("+", "")}`
        : null,
      label: contacts.whatsapp,
    },
  ].filter((item) => item.value);

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-foreground">{t("contacts_title")}</h2>
      <div className="space-y-2">
        {contactItems.map((item) => (
          <a
            key={item.key}
            href={item.href || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-violet-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-600"
          >
            <item.icon className="h-5 w-5 text-violet-500" />
            <span className="text-foreground">{item.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
