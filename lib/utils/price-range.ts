/**
 * Utility for calculating price and duration ranges from specialist service assignments.
 *
 * When multiple specialists offer the same service at different prices,
 * we display a range (e.g., "$25-40") to help users understand pricing options.
 */

export interface PriceRange {
  /** Minimum price in cents */
  minPriceCents: number;
  /** Maximum price in cents */
  maxPriceCents: number;
  /** Whether there's a price range (min !== max) */
  hasRange: boolean;
}

export interface DurationRange {
  /** Minimum duration in minutes */
  minMinutes: number;
  /** Maximum duration in minutes */
  maxMinutes: number;
  /** Whether there's a duration range (min !== max) */
  hasRange: boolean;
}

export interface ServicePriceInfo extends PriceRange, DurationRange {
  /** Number of specialists offering this service */
  specialistCount: number;
}

interface Assignment {
  price_cents: number;
  duration_minutes: number;
}

/**
 * Calculate price range from an array of specialist assignments.
 *
 * @param assignments - Array of assignments with price_cents
 * @returns PriceRange with min, max, and hasRange flag
 */
export function calculatePriceRange(assignments: Assignment[]): PriceRange {
  if (assignments.length === 0) {
    return {
      minPriceCents: 0,
      maxPriceCents: 0,
      hasRange: false,
    };
  }

  const prices = assignments.map((a) => a.price_cents);
  const minPriceCents = Math.min(...prices);
  const maxPriceCents = Math.max(...prices);

  return {
    minPriceCents,
    maxPriceCents,
    hasRange: minPriceCents !== maxPriceCents,
  };
}

/**
 * Calculate duration range from an array of specialist assignments.
 *
 * @param assignments - Array of assignments with duration_minutes
 * @returns DurationRange with min, max, and hasRange flag
 */
export function calculateDurationRange(
  assignments: Assignment[],
): DurationRange {
  if (assignments.length === 0) {
    return {
      minMinutes: 0,
      maxMinutes: 0,
      hasRange: false,
    };
  }

  const durations = assignments.map((a) => a.duration_minutes);
  const minMinutes = Math.min(...durations);
  const maxMinutes = Math.max(...durations);

  return {
    minMinutes,
    maxMinutes,
    hasRange: minMinutes !== maxMinutes,
  };
}

/**
 * Calculate full service price info including price range, duration range, and specialist count.
 *
 * @param assignments - Array of assignments with price_cents and duration_minutes
 * @returns ServicePriceInfo with all range information
 */
export function calculateServicePriceInfo(
  assignments: Assignment[],
): ServicePriceInfo {
  const priceRange = calculatePriceRange(assignments);
  const durationRange = calculateDurationRange(assignments);

  return {
    ...priceRange,
    ...durationRange,
    specialistCount: assignments.length,
  };
}

/**
 * Format price in cents to display string.
 *
 * @param cents - Price in cents
 * @param currency - Currency code (default: "UAH")
 * @param locale - Locale for formatting (default: "uk-UA")
 * @returns Formatted price string (e.g., "250 ₴")
 */
export function formatPrice(
  cents: number,
  currency = "UAH",
  locale = "uk-UA",
): string {
  const amount = cents / 100;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format price range to display string.
 *
 * @param range - PriceRange object
 * @param currency - Currency code (default: "UAH")
 * @param locale - Locale for formatting (default: "uk-UA")
 * @returns Formatted price range string (e.g., "250-400 ₴" or "300 ₴")
 */
export function formatPriceRange(
  range: PriceRange,
  currency = "UAH",
  locale = "uk-UA",
): string {
  if (!range.hasRange) {
    return formatPrice(range.minPriceCents, currency, locale);
  }

  // For range, show "min-max ₴" format
  const minAmount = range.minPriceCents / 100;
  const maxAmount = range.maxPriceCents / 100;

  // Get currency symbol
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  });

  const parts = formatter.formatToParts(0);
  const currencySymbol =
    parts.find((p) => p.type === "currency")?.value ?? currency;

  return `${minAmount}–${maxAmount} ${currencySymbol}`;
}

/** Duration unit labels for localization */
export interface DurationLabels {
  /** Minutes abbreviation (e.g., "min" or "хв") */
  min: string;
  /** Hours abbreviation (e.g., "h" or "год") */
  hour: string;
}

/** Default English duration labels */
const defaultDurationLabels: DurationLabels = {
  min: "min",
  hour: "h",
};

/**
 * Format duration in minutes to display string.
 *
 * @param minutes - Duration in minutes
 * @param labels - Optional localized labels for units
 * @returns Formatted duration string (e.g., "45 min" or "1h 30min")
 */
export function formatDuration(
  minutes: number,
  labels: DurationLabels = defaultDurationLabels,
): string {
  if (minutes < 60) {
    return `${minutes} ${labels.min}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}${labels.hour}`;
  }

  return `${hours}${labels.hour} ${remainingMinutes}${labels.min}`;
}

/**
 * Format duration range to display string.
 *
 * @param range - DurationRange object
 * @param labels - Optional localized labels for units
 * @returns Formatted duration range string (e.g., "30-45 min" or "45 min")
 */
export function formatDurationRange(
  range: DurationRange,
  labels: DurationLabels = defaultDurationLabels,
): string {
  if (!range.hasRange) {
    return formatDuration(range.minMinutes, labels);
  }

  // For ranges under 60 minutes, use simple format
  if (range.maxMinutes < 60) {
    return `${range.minMinutes}–${range.maxMinutes} ${labels.min}`;
  }

  // For longer durations, show full format for each
  return `${formatDuration(range.minMinutes, labels)}–${formatDuration(range.maxMinutes, labels)}`;
}
