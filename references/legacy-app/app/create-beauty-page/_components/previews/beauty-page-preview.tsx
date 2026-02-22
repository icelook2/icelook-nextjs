"use client";

import { useTranslations } from "next-intl";
import { Avatar } from "@/lib/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { formatDuration, formatPrice } from "../../_lib/constants";
import type { ServiceData } from "../../_lib/types";

type PreviewTab = "services" | "contacts";

interface BeautyPagePreviewProps {
  name: string;
  nickname: string;
  /** Avatar preview URL (blob URL for preview during creation flow) */
  avatarPreviewUrl?: string | null;
  /** Instagram username */
  instagram?: string;
  /** Telegram username */
  telegram?: string;
  /** Phone number */
  phone?: string;
  /** Which tab to show as active */
  activeTab?: PreviewTab;
  /** Compact mode shows only hero card (for mobile) */
  compact?: boolean;
  /** Services to display (shows empty state message if not provided) */
  services?: ServiceData[];
}

/**
 * Full beauty page preview that exactly matches the real beauty page layout.
 * Uses the same components and styling as app/[nickname]/page.tsx
 *
 * Layout mirrors the real page:
 * - Hero section with avatar, name, nickname (no rating for new pages)
 * - Profile tabs (Services, Reviews, Contacts) - hidden in compact mode
 * - Services section with service group card - hidden in compact mode
 *
 * Note: No star rating is shown because new beauty pages have 0 reviews.
 * The real HeroSection only shows rating when totalReviews > 0.
 *
 * Expects parent to provide bg-background for proper card contrast.
 */
export function BeautyPagePreview({
  name,
  nickname,
  avatarPreviewUrl,
  instagram,
  telegram,
  phone,
  activeTab = "services",
  compact,
  services = [],
}: BeautyPagePreviewProps) {
  const t = useTranslations("create_beauty_page.preview");
  const displayName = name || t("default_name");
  const displayNickname = nickname || "your-page";
  const serviceCount = services.length;

  return (
    <div className="space-y-4">
      {/* Hero Section - matches real HeroSection inside Paper */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-4">
        <section>
          {/* Avatar + Name row - exact match to HeroSection */}
          <div className="flex items-start gap-4">
            {/* Avatar - using real Avatar component with beauty page styling */}
            <Avatar name={displayName} url={avatarPreviewUrl} size="xl" shape="rounded" />

            {/* Name and nickname - no rating for new pages (0 reviews) */}
            <div className="min-w-0 flex-1 space-y-1">
              <div>
                <h2 className="text-lg font-semibold">{displayName}</h2>
                <p className="text-sm text-muted">@{displayNickname}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Tabs and Content - hidden in compact mode */}
      {!compact && (
        <>
          {/* Tabs - matches ProfileTabs styling exactly */}
          <div className="flex gap-2">
            <TabButton label={t("tabs.services")} count={serviceCount} active={activeTab === "services"} />
            <TabButton label={t("tabs.reviews")} count={0} />
            <TabButton label={t("tabs.contacts")} active={activeTab === "contacts"} />
          </div>

          {/* Content based on active tab */}
          {activeTab === "services" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              {/* Group header - matches real ServiceGroupCard */}
              <div className="px-4 py-3">
                <div className="font-semibold">{t("services_group")}</div>
              </div>

              {/* Service rows - shows real services or empty state */}
              {serviceCount > 0 ? (
                <div className="divide-y divide-border border-t border-border">
                  {services.map((service) => (
                    <ServiceRowPreview key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="border-t border-border px-4 py-6 text-center">
                  <p className="text-sm text-muted">{t("empty_services")}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="p-4">
                {instagram || telegram || phone ? (
                  <div className="space-y-3">
                    {instagram && (
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                          <InstagramIcon className="size-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-muted">Instagram</p>
                          <p className="truncate font-medium">@{instagram.replace(/^@/, "")}</p>
                        </div>
                      </div>
                    )}
                    {telegram && (
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500">
                          <TelegramIcon className="size-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-muted">Telegram</p>
                          <p className="truncate font-medium">@{telegram.replace(/^@/, "")}</p>
                        </div>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500">
                          <PhoneIcon className="size-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-muted">{t("phone")}</p>
                          <p className="truncate font-medium">{phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted">{t("empty_contacts")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Tab button matching ProfileTabs styling exactly.
 * Uses the same classes as the real component.
 */
function TabButton({
  label,
  count,
  active,
}: {
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
        active
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface",
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium",
            active
              ? "bg-white/20 text-white"
              : "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
}

/**
 * Service row preview matching real ServiceRow styling.
 * Shows service name, duration, price, and checkbox.
 */
function ServiceRowPreview({ service }: { service: ServiceData }) {
  const priceDisplay = formatPrice(service.priceCents);
  const durationDisplay = formatDuration(service.durationMinutes);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Service info - matches ServiceRow layout */}
      <div className="min-w-0 flex-1">
        <span className="font-medium">{service.name}</span>
        <div className="mt-0.5 text-sm text-muted">
          <span>{durationDisplay}</span>
          <span className="mx-1.5">·</span>
          <span className="font-medium text-foreground">{priceDisplay} UAH</span>
        </div>
      </div>

      {/* Circle checkbox - matches real checkbox styling */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-transparent" />
    </div>
  );
}

/**
 * Instagram icon (custom SVG to avoid deprecated lucide icon)
 */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/**
 * Telegram icon (paper plane style)
 */
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

/**
 * Phone icon
 */
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
