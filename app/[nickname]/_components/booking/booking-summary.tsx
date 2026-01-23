import type { ProfileService } from "@/lib/queries/beauty-page-profile";
import type { PublicBundle } from "@/lib/types/bundles";
import { Avatar } from "@/lib/ui/avatar";
import { DiscountBadge } from "@/lib/ui/discount-badge";
import { formatPrice } from "@/lib/utils/price-range";
import { SummaryRow } from "./summary-row";

interface BookingSummaryTranslations {
  who: string;
  when: string;
  where: string;
  what: string;
  price: string;
  duration: string;
}

interface CreatorInfo {
  displayName: string;
  avatarUrl: string | null;
}

interface BookingSummaryProps {
  translations: BookingSummaryTranslations;
  creatorInfo: CreatorInfo;
  formattedDate: string;
  formattedTime: string;
  formattedDuration: string;
  address?: string;
  selectedServices: ProfileService[];
  formattedPrice: string;
  currency: string;
  locale: string;
  // Bundle props
  selectedBundle?: PublicBundle | null;
  originalPriceCents?: number;
  totalPriceCents?: number;
  // Reschedule mode props
  hasDateTimeChanged?: boolean;
  formattedOriginalDate?: string | null;
  formattedOriginalTime?: string | null;
  // Price change props
  hasPriceChanged?: boolean;
  formattedOriginalPrice?: string | null;
  priceChangedNotice?: string;
}

/**
 * Booking summary section showing Who, When, Where, What, Price.
 *
 * Handles reschedule mode (showing crossed-out original values)
 * and price change notices.
 */
export function BookingSummary({
  translations,
  creatorInfo,
  formattedDate,
  formattedTime,
  formattedDuration,
  address,
  selectedServices,
  formattedPrice,
  currency,
  locale,
  selectedBundle,
  originalPriceCents,
  totalPriceCents,
  hasDateTimeChanged,
  formattedOriginalDate,
  formattedOriginalTime,
  hasPriceChanged,
  formattedOriginalPrice,
  priceChangedNotice,
}: BookingSummaryProps) {
  // Calculate bundle discount percentage
  const bundleDiscountPercentage =
    selectedBundle &&
    originalPriceCents &&
    totalPriceCents &&
    originalPriceCents > totalPriceCents
      ? Math.round(
          ((originalPriceCents - totalPriceCents) / originalPriceCents) * 100,
        )
      : 0;

  return (
    <div className="space-y-4">
      {/* Who (Creator) */}
      <SummaryRow label={translations.who}>
        <div className="flex items-center gap-2">
          <Avatar
            url={creatorInfo.avatarUrl}
            name={creatorInfo.displayName}
            size="sm"
          />
          <span className="font-medium text-foreground">
            {creatorInfo.displayName}
          </span>
        </div>
      </SummaryRow>

      {/* When */}
      <SummaryRow label={translations.when}>
        <div>
          {/* Show original date/time crossed out when rescheduling */}
          {hasDateTimeChanged &&
            formattedOriginalDate &&
            formattedOriginalTime && (
              <div className="mb-1">
                <div className="text-sm text-muted line-through">
                  {formattedOriginalDate}
                </div>
                <div className="text-sm text-muted line-through">
                  {formattedOriginalTime} ({formattedDuration})
                </div>
              </div>
            )}
          {/* New date/time */}
          <div className="font-medium text-foreground">{formattedDate}</div>
          <div className="text-sm text-muted">
            {formattedTime} ({formattedDuration})
          </div>
        </div>
      </SummaryRow>

      {/* Where */}
      {address && (
        <SummaryRow label={translations.where}>
          <span className="text-foreground">{address}</span>
        </SummaryRow>
      )}

      {/* What */}
      <SummaryRow label={translations.what}>
        <div className="space-y-1">
          {/* Bundle header if applicable */}
          {selectedBundle && (
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-foreground">
                {selectedBundle.name}
              </span>
              <DiscountBadge percentage={bundleDiscountPercentage} />
            </div>
          )}
          {selectedServices.map((service) => (
            <div key={service.id} className="flex items-center justify-between">
              <span className="text-foreground">{service.name}</span>
              {/* Only show individual prices if NOT a bundle */}
              {!selectedBundle && (
                <span className="text-sm text-muted">
                  {formatPrice(service.price_cents, currency, locale)}
                </span>
              )}
            </div>
          ))}
        </div>
      </SummaryRow>

      {/* Price */}
      <SummaryRow label={translations.price}>
        <div className="flex items-center gap-2">
          {/* Show original price crossed out for bundles */}
          {selectedBundle &&
            originalPriceCents &&
            originalPriceCents > (totalPriceCents ?? 0) && (
              <span className="text-sm text-muted line-through">
                {formatPrice(originalPriceCents, currency, locale)}
              </span>
            )}
          <span className="font-semibold text-foreground">
            {formattedPrice}
          </span>
          {hasPriceChanged && formattedOriginalPrice && !selectedBundle && (
            <span className="text-sm text-muted line-through">
              {formattedOriginalPrice}
            </span>
          )}
        </div>
      </SummaryRow>

      {/* Price change notice */}
      {hasPriceChanged && priceChangedNotice && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {priceChangedNotice}
          </p>
        </div>
      )}
    </div>
  );
}
