import { Mail, MapPin, Phone } from "lucide-react";
import type { ContactInfo } from "@/lib/queries/beauty-page-profile";
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

export function ContactSection({ contact, translations }: ContactSectionProps) {
  const address = formatAddress(contact);
  const hasAnyContact = address || contact.phone || contact.email;

  // Don't render if no contact info at all
  if (!hasAnyContact) {
    return null;
  }

  return (
    <section>
      <Paper className="space-y-3 p-4">
        {translations.title && (
          <h3 className="font-semibold">{translations.title}</h3>
        )}

        <div className="space-y-2.5">
          {/* Address */}
          {address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 transition-colors hover:text-foreground"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-sm text-muted">{address}</span>
            </a>
          )}

          {/* Phone */}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-3 transition-colors hover:text-foreground"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                <Phone className="h-4 w-4" />
              </div>
              <span className="text-sm text-muted">{contact.phone}</span>
            </a>
          )}

          {/* Email */}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-3 transition-colors hover:text-foreground"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-sm text-muted">{contact.email}</span>
            </a>
          )}
        </div>
      </Paper>
    </section>
  );
}
