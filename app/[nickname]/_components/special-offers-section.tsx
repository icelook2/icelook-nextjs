"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { Clock, Percent } from "lucide-react";
import type { PublicSpecialOffer } from "@/lib/queries/special-offers";
import { cn } from "@/lib/utils/cn";
import { useServiceSelection } from "./service-selection-context";

interface SpecialOffersSectionProps {
  offers: PublicSpecialOffer[];
  currency: string;
  locale: string;
  translations: {
    title: string;
    today: string;
    tomorrow: string;
    bookNow: string;
  };
}

export function SpecialOffersSection({
  offers,
  currency,
  locale,
  translations: t,
}: SpecialOffersSectionProps) {
  const { toggleService, selectedServiceIds } = useServiceSelection();

  if (offers.length === 0) {
    return null;
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function formatOfferDate(dateString: string) {
    const date = new Date(dateString);
    if (isToday(date)) {
      return t.today;
    }
    if (isTomorrow(date)) {
      return t.tomorrow;
    }
    return format(date, "EEE, MMM d");
  }

  function handleOfferClick(offer: PublicSpecialOffer) {
    // Toggle the service selection (using discounted price for special offer)
    toggleService({
      id: offer.service.id,
      name: offer.service.name,
      price_cents: offer.discountedPriceCents,
      duration_minutes: offer.service.durationMinutes,
      display_order: 0, // Not relevant for selection
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t.title}</h2>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {offers.map((offer) => {
          const isSelected = selectedServiceIds.has(offer.service.id);

          return (
            <button
              key={offer.id}
              type="button"
              onClick={() => handleOfferClick(offer)}
              className={cn(
                "relative flex min-w-[200px] flex-col rounded-2xl border p-4 text-left transition-all",
                "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/30"
                  : "border-emerald-200 hover:border-emerald-300 dark:border-emerald-800 dark:hover:border-emerald-700",
              )}
            >
              {/* Discount badge */}
              <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                <Percent className="h-3 w-3" />
                <span>-{offer.discountPercentage}%</span>
              </div>

              {/* Service name */}
              <p className="pr-12 font-medium leading-tight">
                {offer.service.name}
              </p>

              {/* Date & Time */}
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {formatOfferDate(offer.date)}, {offer.startTime}
                </span>
              </div>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatPrice(offer.discountedPriceCents)}
                </span>
                <span className="text-sm text-muted line-through">
                  {formatPrice(offer.originalPriceCents)}
                </span>
              </div>

              {/* CTA */}
              <div className="mt-2">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {t.bookNow} &rarr;
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
