import {
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import type { ContactInfo } from "@/lib/queries/beauty-page-profile";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Paper } from "@/lib/ui/paper";

interface ContactSectionProps {
  contact: ContactInfo;
  translations: {
    title: string;
    viewOnMap: string;
    visitInstagram: string;
  };
}

/**
 * Format address from parts.
 */
function formatAddress(contact: ContactInfo): string | null {
  const parts = [contact.address, contact.city, contact.postal_code].filter(
    Boolean,
  );

  if (parts.length === 0) {
    return null;
  }

  return parts.join(", ");
}

/**
 * Generate Google Maps link from address.
 */
function getMapLink(contact: ContactInfo): string {
  const address = formatAddress(contact);
  if (!address) {
    return "#";
  }

  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

/**
 * Extract Instagram username from URL.
 */
function getInstagramHandle(url: string): string {
  // Handle full URLs like https://www.instagram.com/username
  const match = url.match(/instagram\.com\/([^/?]+)/);
  if (match) {
    return `@${match[1]}`;
  }
  // If it's already just a username
  if (url.startsWith("@")) {
    return url;
  }
  return `@${url}`;
}

export function ContactSection({ contact, translations }: ContactSectionProps) {
  const address = formatAddress(contact);
  const hasAnyContact =
    address ||
    contact.phone ||
    contact.email ||
    contact.website_url ||
    contact.instagram_url ||
    contact.facebook_url;

  // Don't render if no contact info at all
  if (!hasAnyContact) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">{translations.title}</h2>

      <Paper className="divide-y divide-border">
        {/* Address */}
        {address && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="min-w-0 flex-1">{address}</span>
            <a
              href={getMapLink(contact)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <ExternalLink className="h-4 w-4" />
              {translations.viewOnMap}
            </a>
          </div>
        )}

        {/* Phone */}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
              <Phone className="h-5 w-5" />
            </div>
            <span className="min-w-0 flex-1">{contact.phone}</span>
          </a>
        )}

        {/* Email */}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <span className="min-w-0 flex-1 truncate">{contact.email}</span>
          </a>
        )}

        {/* Website */}
        {contact.website_url && (
          <a
            href={contact.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
              <Globe className="h-5 w-5" />
            </div>
            <span className="min-w-0 flex-1 truncate">
              {contact.website_url.replace(/^https?:\/\//, "")}
            </span>
          </a>
        )}

        {/* Instagram */}
        {contact.instagram_url && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <Instagram className="h-5 w-5" />
            </div>
            <span className="min-w-0 flex-1">
              {getInstagramHandle(contact.instagram_url)}
            </span>
            <a
              href={contact.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <ExternalLink className="h-4 w-4" />
              {translations.visitInstagram}
            </a>
          </div>
        )}

        {/* Facebook */}
        {contact.facebook_url && (
          <a
            href={contact.facebook_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Facebook className="h-5 w-5" />
            </div>
            <span className="min-w-0 flex-1 truncate">Facebook</span>
          </a>
        )}
      </Paper>
    </section>
  );
}
