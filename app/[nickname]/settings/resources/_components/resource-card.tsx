"use client";

import { AlertTriangle, Minus, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import type { ResourceWithStatus } from "@/lib/types/resources";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { NumberField } from "@/lib/ui/number-field";
import { adjustStock } from "../_actions/resource.actions";
import { formatStockWithUnit, formatPrice } from "../_lib/constants";

interface ResourceCardProps {
  resource: ResourceWithStatus;
  variant: "active" | "inactive";
  noBorder?: boolean;
  onToggleActive: (resource: ResourceWithStatus) => void;
  onDelete: (resource: ResourceWithStatus) => void;
  isPending: boolean;
  beautyPageId: string;
  nickname: string;
  translations: {
    inStock: string;
    lowStock: string;
    outOfStock: string;
    activate: string;
    deactivate: string;
    inactive: string;
    totalValue: string;
    adjustStock: string;
    adjustStockAdd: string;
    adjustStockRemove: string;
    save: string;
    cancel: string;
  };
  locale: string;
  currency: string;
}

export function ResourceCard({
  resource,
  variant,
  noBorder,
  onToggleActive,
  onDelete,
  isPending,
  beautyPageId,
  nickname,
  translations: t,
  locale,
  currency,
}: ResourceCardProps) {
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [isAdjusting, startTransition] = useTransition();

  const isInactive = variant === "inactive";
  const { stockStatus } = resource;

  function getStockStatusLabel(): string {
    if (stockStatus.reason === "out_of_stock") {
      return t.outOfStock;
    }
    if (stockStatus.isLow) {
      return t.lowStock;
    }
    return t.inStock;
  }

  function getStockStatusColor(): string {
    if (stockStatus.reason === "out_of_stock") {
      return "text-red-600 dark:text-red-400";
    }
    if (stockStatus.isLow) {
      return "text-amber-600 dark:text-amber-400";
    }
    return "text-green-600 dark:text-green-400";
  }

  function handleAdjustSubmit() {
    if (adjustmentValue === 0) {
      return;
    }

    startTransition(async () => {
      const result = await adjustStock({
        resourceId: resource.id,
        beautyPageId,
        nickname,
        adjustment: adjustmentValue,
      });

      if (result.success) {
        setAdjustDialogOpen(false);
        setAdjustmentValue(0);
      }
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-4 p-4",
          !noBorder && "border-b border-border",
          isInactive && "opacity-60",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{resource.name}</h3>
            {isInactive && (
              <span className="text-xs text-muted bg-muted/20 px-1.5 py-0.5 rounded">
                {t.inactive}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {/* Stock level */}
            <div className="flex items-center gap-1.5">
              {stockStatus.isLow && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span className={getStockStatusColor()}>
                {formatStockWithUnit(resource.current_stock, resource.unit)}
              </span>
              <span className="text-xs">({getStockStatusLabel()})</span>
            </div>

            {/* Cost per unit */}
            {resource.cost_per_unit_cents > 0 && (
              <span>
                {formatPrice(resource.cost_per_unit_cents, locale, currency)}/{resource.unit}
              </span>
            )}

            {/* Total value */}
            {resource.totalValueCents > 0 && (
              <span className="text-xs">
                {t.totalValue}: {formatPrice(resource.totalValueCents, locale, currency)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Adjust stock button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdjustDialogOpen(true)}
            disabled={isPending}
            title={t.adjustStock}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Toggle active/inactive */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(resource)}
            disabled={isPending}
            title={isInactive ? t.activate : t.deactivate}
          >
            {isInactive ? (
              <ToggleLeft className="h-4 w-4" />
            ) : (
              <ToggleRight className="h-4 w-4" />
            )}
          </Button>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(resource)}
            disabled={isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog.Root open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <Dialog.Portal open={adjustDialogOpen} size="sm">
          <Dialog.Header>{t.adjustStock}</Dialog.Header>
          <Dialog.Body>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted mb-2">
                  {resource.name} - {formatStockWithUnit(resource.current_stock, resource.unit)}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAdjustmentValue((v) => v - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <NumberField
                  value={adjustmentValue}
                  onValueChange={(value) => setAdjustmentValue(value ?? 0)}
                  className="w-24 text-center"
                />

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAdjustmentValue((v) => v + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {adjustmentValue !== 0 && (
                <p className="text-center text-sm">
                  {adjustmentValue > 0 ? t.adjustStockAdd : t.adjustStockRemove}:{" "}
                  <strong>
                    {formatStockWithUnit(Math.abs(adjustmentValue), resource.unit)}
                  </strong>
                </p>
              )}
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              variant="ghost"
              onClick={() => {
                setAdjustDialogOpen(false);
                setAdjustmentValue(0);
              }}
            >
              {t.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={handleAdjustSubmit}
              disabled={adjustmentValue === 0 || isAdjusting}
            >
              {t.save}
            </Button>
          </Dialog.Footer>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
