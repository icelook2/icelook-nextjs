/**
 * Constants and helpers for resources feature.
 */

/**
 * Preset unit options for quick selection
 */
export const UNIT_PRESETS = [
  { value: "ml", label: "ml (milliliters)" },
  { value: "g", label: "g (grams)" },
  { value: "oz", label: "oz (ounces)" },
  { value: "pieces", label: "pieces" },
  { value: "applications", label: "applications" },
  { value: "sheets", label: "sheets" },
] as const;

/**
 * Common stock adjustment presets
 */
export const STOCK_ADJUSTMENT_PRESETS = [1, 5, 10, 25, 50, 100] as const;

/**
 * Low stock threshold suggestions based on unit
 */
export const LOW_STOCK_SUGGESTIONS: Record<string, number[]> = {
  ml: [10, 25, 50, 100],
  g: [10, 25, 50, 100],
  oz: [1, 2, 5, 10],
  pieces: [2, 5, 10, 20],
  applications: [2, 5, 10, 20],
  sheets: [5, 10, 25, 50],
};

/**
 * Format price in cents to display string
 */
export function formatPrice(
  cents: number,
  locale: string,
  currency: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format stock amount with unit
 */
export function formatStockWithUnit(stock: number, unit: string): string {
  // Format decimal numbers nicely (remove trailing zeros)
  const formattedStock = Number.isInteger(stock)
    ? stock.toString()
    : stock.toFixed(2).replace(/\.?0+$/, "");

  return `${formattedStock} ${unit}`;
}

/**
 * Get unit label for display
 */
export function getUnitLabel(unit: string): string {
  const preset = UNIT_PRESETS.find((p) => p.value === unit);
  return preset?.label ?? unit;
}
