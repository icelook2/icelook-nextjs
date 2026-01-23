import type { ServiceGroupWithServices } from "@/lib/queries/services";

// Percentage discount preset options
export const DISCOUNT_OPTIONS = [
  { value: 5, label: "5%" },
  { value: 10, label: "10%" },
  { value: 15, label: "15%" },
  { value: 20, label: "20%" },
  { value: 25, label: "25%" },
  { value: 30, label: "30%" },
];

// Fixed discount preset options (in currency units, e.g., 50 = 50 UAH)
export const FIXED_DISCOUNT_OPTIONS = [
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: 150, label: "150" },
  { value: 200, label: "200" },
  { value: 300, label: "300" },
  { value: 500, label: "500" },
];

export interface FlattenedService {
  id: string;
  name: string;
  groupName: string;
  groupId: string;
  priceCents: number;
  durationMinutes: number;
}

// Flatten services from groups for selection
export function flattenServices(
  groups: ServiceGroupWithServices[],
): FlattenedService[] {
  return groups.flatMap((group) =>
    group.services.map((service) => ({
      id: service.id,
      name: service.name,
      groupName: group.name,
      groupId: group.id,
      priceCents: service.price_cents,
      durationMinutes: service.duration_minutes,
    })),
  );
}

export function formatPrice(cents: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
