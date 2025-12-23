/**
 * Timezone utilities using IANA timezone database via Intl API.
 *
 * Uses Intl.supportedValuesOf('timeZone') which returns all IANA timezone
 * identifiers supported by the runtime. This is the modern standard approach.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  region: string;
}

/**
 * Get UTC offset string for a timezone (e.g., "+02:00" or "-05:00")
 */
function getTimezoneOffset(timezone: string): string {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");

    if (offsetPart) {
      // Convert "GMT+2" to "+02:00" format
      const match = offsetPart.value.match(/GMT([+-]?)(\d+)?(?::(\d+))?/);
      if (match) {
        const sign = match[1] || "+";
        const hours = match[2] ? match[2].padStart(2, "0") : "00";
        const minutes = match[3] ? match[3].padStart(2, "0") : "00";
        return `${sign}${hours}:${minutes}`;
      }
    }

    return "+00:00";
  } catch {
    return "+00:00";
  }
}

/**
 * Format timezone for display: "Europe/Kyiv" -> "Kyiv"
 */
function formatTimezoneName(timezone: string): string {
  const parts = timezone.split("/");
  const city = parts[parts.length - 1];
  return city.replace(/_/g, " ");
}

/**
 * Extract region from timezone: "Europe/Kyiv" -> "Europe"
 */
function getTimezoneRegion(timezone: string): string {
  const parts = timezone.split("/");
  return parts[0];
}

/**
 * Get all available timezones as options for Combobox.
 * Returns sorted list with UTC offset and region information.
 */
export function getAllTimezones(): TimezoneOption[] {
  // Intl.supportedValuesOf is the modern standard (ES2022+)
  // Supported in all modern browsers and Node.js 18+
  const timezones = Intl.supportedValuesOf("timeZone");

  const options: TimezoneOption[] = timezones.map((tz) => {
    const offset = getTimezoneOffset(tz);
    const name = formatTimezoneName(tz);
    const region = getTimezoneRegion(tz);

    return {
      value: tz,
      label: `(UTC${offset}) ${name}`,
      offset,
      region,
    };
  });

  // Sort by UTC offset (numeric), then alphabetically by name
  return options.sort((a, b) => {
    const offsetA = parseOffset(a.offset);
    const offsetB = parseOffset(b.offset);

    if (offsetA !== offsetB) {
      return offsetA - offsetB;
    }

    return a.label.localeCompare(b.label);
  });
}

/**
 * Parse offset string to minutes for sorting.
 * "+02:00" -> 120, "-05:30" -> -330
 */
function parseOffset(offset: string): number {
  const match = offset.match(/([+-])(\d{2}):(\d{2})/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);

  return sign * (hours * 60 + minutes);
}

/**
 * Group timezones by region for better organization.
 */
export function getTimezonesByRegion(): Map<string, TimezoneOption[]> {
  const timezones = getAllTimezones();
  const grouped = new Map<string, TimezoneOption[]>();

  for (const tz of timezones) {
    const existing = grouped.get(tz.region) ?? [];
    existing.push(tz);
    grouped.set(tz.region, existing);
  }

  return grouped;
}

/**
 * Find a timezone option by its IANA identifier.
 */
export function findTimezone(value: string): TimezoneOption | undefined {
  return getAllTimezones().find((tz) => tz.value === value);
}
