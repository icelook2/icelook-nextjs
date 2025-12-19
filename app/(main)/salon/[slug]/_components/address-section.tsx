import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

interface AddressSectionProps {
  address: {
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string | null;
    postal_code: string | null;
    country: string;
  };
}

export function AddressSection({ address }: AddressSectionProps) {
  const t = useTranslations("salon.profile");

  // Format address into lines
  const lines = [
    address.address_line1,
    address.address_line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
  ].filter(Boolean);

  // Generate Google Maps link
  const mapsQuery = encodeURIComponent(
    [address.address_line1, address.city, address.country].join(", "),
  );
  const mapsUrl = `https://maps.google.com/?q=${mapsQuery}`;

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-foreground">{t("address_title")}</h2>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-violet-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-600"
      >
        <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500" />
        <div className="space-y-0.5">
          {lines.map((line, index) => (
            <p
              key={index}
              className={index === 0 ? "font-medium text-foreground" : "text-sm text-foreground/60"}
            >
              {line}
            </p>
          ))}
        </div>
      </a>
    </section>
  );
}
