import Image from "next/image";
import type { BeautyPageInfo } from "@/lib/queries/beauty-page-profile";
import type { OpenStatus } from "@/lib/utils/open-status";
import { OpenStatusBadge } from "./open-status-badge";
import { VerifiedBadge } from "./verified-badge";

interface HeroSectionProps {
  info: BeautyPageInfo;
  openStatus: OpenStatus;
  translations: {
    openNow: string;
    closed: string;
    closesAt: string;
    opensAt: string;
    verified: {
      title: string;
      description: string;
    };
  };
}

// Consistent gradients for logo fallback based on name
const gradients = [
  "from-blue-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-indigo-500",
];

export function HeroSection({
  info,
  openStatus,
  translations,
}: HeroSectionProps) {
  const initial = info.name.charAt(0).toUpperCase();
  const gradientIndex = info.name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <section className="px-4 pb-6 lg:px-6 xl:px-8">
      {/* Logo, type badge, and status */}
      <div className="flex items-start gap-4">
        {/* Logo/Avatar */}
        {info.logo_url ? (
          <Image
            src={info.logo_url}
            alt={info.name}
            width={80}
            height={80}
            className="h-20 w-20 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-3xl font-bold text-white`}
          >
            {initial}
          </div>
        )}

        {/* Name, nickname, type badge, and status */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Name with verified badge and nickname */}
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-semibold">{info.name}</h2>
              {info.is_verified && (
                <VerifiedBadge translations={translations.verified} />
              )}
            </div>
            <p className="text-sm text-muted">@{info.slug}</p>
          </div>

          {/* Type badge and status */}
          <div className="flex flex-wrap items-center gap-2">
            {info.type && (
              <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-medium text-accent">
                {info.type.name}
              </span>
            )}

            <OpenStatusBadge
              status={openStatus}
              openText={translations.openNow}
              closedText={translations.closed}
              closesAtText={translations.closesAt}
              opensAtText={translations.opensAt}
            />
          </div>

          {/* Description */}
          {info.description && (
            <p className="text-sm text-muted">{info.description}</p>
          )}
        </div>
      </div>
    </section>
  );
}
