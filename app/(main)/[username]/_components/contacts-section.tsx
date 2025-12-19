"use client";

import { useTranslations } from "next-intl";
import { Instagram, Phone, Send, MessageCircle } from "lucide-react";
import { Button } from "@/lib/ui/button";

interface ContactsData {
  instagram: string | null;
  phone: string | null;
  telegram: string | null;
  viber: string | null;
  whatsapp: string | null;
}

interface ContactsSectionProps {
  contacts: ContactsData | null;
}

export function ContactsSection({ contacts }: ContactsSectionProps) {
  const t = useTranslations("specialist.profile");

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

  // Build contact links
  const contactLinks = [];

  if (contacts.instagram) {
    const username = contacts.instagram.replace(/^@/, "");
    contactLinks.push({
      type: "instagram",
      label: "Instagram",
      href: `https://instagram.com/${username}`,
      icon: Instagram,
    });
  }

  if (contacts.phone) {
    contactLinks.push({
      type: "phone",
      label: t("call"),
      href: `tel:${contacts.phone}`,
      icon: Phone,
    });
  }

  if (contacts.telegram) {
    const username = contacts.telegram.replace(/^@/, "");
    contactLinks.push({
      type: "telegram",
      label: "Telegram",
      href: `https://t.me/${username}`,
      icon: Send,
    });
  }

  if (contacts.viber) {
    contactLinks.push({
      type: "viber",
      label: "Viber",
      href: `viber://chat?number=${contacts.viber.replace(/\D/g, "")}`,
      icon: MessageCircle,
    });
  }

  if (contacts.whatsapp) {
    contactLinks.push({
      type: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`,
      icon: MessageCircle,
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        {t("contacts_title")}
      </h2>

      <div className="flex flex-wrap gap-2">
        {contactLinks.map((contact) => (
          <Button
            key={contact.type}
            variant="secondary"
            size="sm"
            className="gap-2"
            render={(props) => (
              <a
                {...props}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
              />
            )}
          >
            <contact.icon className="h-4 w-4" />
            {contact.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
