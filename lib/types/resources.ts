/**
 * Types for resources (consumables/inventory tracking).
 *
 * Resource Structure:
 * - A resource represents a consumable item (hair dye, nail polish, etc.)
 * - Resources can be linked to services with default usage amounts
 * - Stock is automatically deducted when appointments are completed
 * - Low stock alerts can be configured with thresholds
 */

// ============================================================================
// Enums
// ============================================================================

/** Common units for resources */
export type ResourceUnit =
  | "ml"
  | "g"
  | "pieces"
  | "applications"
  | "sheets"
  | "oz"
  | "custom";

/** Reason for low stock status */
export type LowStockReason = "below_threshold" | "out_of_stock";

// ============================================================================
// Database Types
// ============================================================================

/** Resource as stored in the database */
export type Resource = {
  id: string;
  beauty_page_id: string;
  name: string;
  /** Unit of measurement (ml, g, pieces, etc.) */
  unit: string;
  /** Cost per unit in cents */
  cost_per_unit_cents: number;
  /** Current stock level */
  current_stock: number;
  /** Alert threshold (null = no alerts) */
  low_stock_threshold: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Junction table for service -> resource relationship */
export type ServiceResource = {
  id: string;
  service_id: string;
  resource_id: string;
  /** Default amount used per service */
  default_amount: number;
  created_at: string;
};

/** Record of resource usage for an appointment */
export type ResourceUsage = {
  id: string;
  appointment_id: string;
  resource_id: string;
  /** Amount actually used */
  amount_used: number;
  /** Cost per unit at time of usage (snapshot) */
  unit_cost_cents: number;
  /** Whether this was auto-deducted or manually entered */
  auto_deducted: boolean;
  created_at: string;
};

// ============================================================================
// Application Types
// ============================================================================

/** Stock status for display */
export type StockStatus = {
  isLow: boolean;
  reason?: LowStockReason;
};

/** Resource with computed stock status for display */
export type ResourceWithStatus = Resource & {
  /** Computed stock status */
  stockStatus: StockStatus;
  /** Total value of current stock in cents */
  totalValueCents: number;
};

/** Service-resource link with full resource details */
export type ServiceResourceWithDetails = {
  id: string;
  serviceId: string;
  resourceId: string;
  defaultAmount: number;
  resource: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    costPerUnitCents: number;
    isActive: boolean;
  };
  /** Cost for default amount in cents */
  defaultCostCents: number;
};

/** Resource usage with resource details for display */
export type ResourceUsageWithDetails = ResourceUsage & {
  resourceName: string;
  resourceUnit: string;
  /** Total cost of this usage in cents */
  totalCostCents: number;
};

/** Resource for service linking selection */
export type ResourceForSelection = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  costPerUnitCents: number;
  isActive: boolean;
};

// ============================================================================
// Input Types
// ============================================================================

/** Input for creating a new resource */
export type CreateResourceInput = {
  beautyPageId: string;
  nickname: string;
  name: string;
  unit: string;
  costPerUnitCents?: number;
  currentStock?: number;
  lowStockThreshold?: number | null;
};

/** Input for updating an existing resource */
export type UpdateResourceInput = {
  resourceId: string;
  nickname: string;
  name?: string;
  unit?: string;
  costPerUnitCents?: number;
  currentStock?: number;
  lowStockThreshold?: number | null;
  isActive?: boolean;
};

/** Input for deleting a resource */
export type DeleteResourceInput = {
  resourceId: string;
  nickname: string;
};

/** Input for adjusting stock manually */
export type AdjustStockInput = {
  resourceId: string;
  nickname: string;
  /** Positive to add, negative to subtract */
  adjustment: number;
  reason?: string;
};

/** Input for linking a resource to a service */
export type LinkServiceResourceInput = {
  serviceId: string;
  resourceId: string;
  defaultAmount: number;
  nickname: string;
};

/** Input for unlinking a resource from a service */
export type UnlinkServiceResourceInput = {
  serviceResourceId: string;
  nickname: string;
};

/** Input for updating a service-resource link */
export type UpdateServiceResourceInput = {
  serviceResourceId: string;
  nickname: string;
  defaultAmount: number;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks stock status for display badges.
 */
export function checkStockStatus(resource: {
  current_stock: number;
  low_stock_threshold: number | null;
}): StockStatus {
  if (resource.current_stock <= 0) {
    return { isLow: true, reason: "out_of_stock" };
  }

  if (
    resource.low_stock_threshold !== null &&
    resource.current_stock <= resource.low_stock_threshold
  ) {
    return { isLow: true, reason: "below_threshold" };
  }

  return { isLow: false };
}

/**
 * Calculates total value of current stock in cents.
 */
export function calculateTotalValue(resource: {
  current_stock: number;
  cost_per_unit_cents: number;
}): number {
  return Math.round(resource.current_stock * resource.cost_per_unit_cents);
}

/**
 * Calculates cost for a specific amount of resource.
 */
export function calculateAmountCost(
  amount: number,
  costPerUnitCents: number,
): number {
  return Math.round(amount * costPerUnitCents);
}

/**
 * Formats stock level for display with unit.
 * @example formatStock(150, "ml") => "150 ml"
 * @example formatStock(2.5, "applications") => "2.5 applications"
 */
export function formatStock(stock: number, unit: string): string {
  // Format decimal numbers nicely (remove trailing zeros)
  const formattedStock = Number.isInteger(stock)
    ? stock.toString()
    : stock.toFixed(2).replace(/\.?0+$/, "");

  return `${formattedStock} ${unit}`;
}

/**
 * Checks if there's enough stock for a given amount.
 */
export function hasEnoughStock(
  currentStock: number,
  requiredAmount: number,
): boolean {
  return currentStock >= requiredAmount;
}
