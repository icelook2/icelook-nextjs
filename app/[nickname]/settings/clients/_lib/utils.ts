/**
 * Format currency from cents with thousand separators
 */
export function formatCurrency(
  cents: number,
  currency: string,
  locale = "uk-UA",
): string {
  const amount = cents / 100;

  // Use Intl.NumberFormat for proper thousand separators
  // Format as decimal first, then append currency symbol
  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${formatter.format(amount)} ${currency}`;
}

/**
 * Format date for display
 * Returns "-" for null/undefined dates
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
