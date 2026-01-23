"use client";

import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import type { Service } from "@/lib/queries/services";
import { Avatar } from "@/lib/ui/avatar";
import { formatPrice } from "@/lib/utils/price-range";

interface StepConfirmProps {
  date: Date;
  startTime: string;
  endTime: string;
  clientName: string;
  selectedServices: Service[];
  totalPriceCents: number;
  currency: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  error: string | null;
}

export function StepConfirm({
  date,
  startTime,
  selectedServices,
  totalPriceCents,
  currency,
  clientName,
  notes,
  onNotesChange,
  error,
}: StepConfirmProps) {
  return (
    <div className="space-y-6 px-4 py-4">
      {/* Booking Summary */}
      <div className="space-y-4">
        {/* Client */}
        <SummaryRow label="Client">
          <div className="flex items-center gap-2">
            <Avatar name={clientName} size="sm" />
            <span className="font-medium text-foreground">{clientName}</span>
          </div>
        </SummaryRow>

        {/* When */}
        <SummaryRow label="When">
          <div>
            <div className="font-medium text-foreground">
              {format(date, "EEEE, MMMM d, yyyy")}
            </div>
            <div className="text-sm text-muted">{startTime}</div>
          </div>
        </SummaryRow>

        {/* What */}
        <SummaryRow label="What">
          <div className="space-y-1">
            {selectedServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between"
              >
                <span className="text-foreground">{service.name}</span>
                <span className="text-sm text-muted">
                  {formatPrice(service.price_cents, currency)}
                </span>
              </div>
            ))}
          </div>
        </SummaryRow>

        {/* Price */}
        <SummaryRow label="Price">
          <span className="font-semibold text-foreground">
            {formatPrice(totalPriceCents, currency)}
          </span>
        </SummaryRow>
      </div>

      {/* Notes */}
      <SummaryRow label="Notes">
        <textarea
          id="notes"
          placeholder="Add notes about this appointment..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </SummaryRow>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Summary Row
// ============================================================================

interface SummaryRowProps {
  label: string;
  children: React.ReactNode;
}

function SummaryRow({ label, children }: SummaryRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-20 shrink-0 pt-1 text-xs uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
