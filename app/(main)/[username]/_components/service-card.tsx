"use client";

import { Clock } from "lucide-react";
import {
  formatDuration,
  formatPrice,
  type BookingService,
} from "@/lib/appointments";
import { Checkbox } from "@/lib/ui/checkbox";
import { cn } from "@/lib/utils/cn";

interface ServiceCardProps {
  service: BookingService;
  isSelected: boolean;
  onToggle: () => void;
}

export function ServiceCard({
  service,
  isSelected,
  onToggle,
}: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
        isSelected
          ? "border-violet-500 bg-violet-500/5"
          : "border-foreground/10 bg-foreground/5 hover:border-foreground/20",
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        className="shrink-0"
      />

      <div className="min-w-0 flex-1">
        <h4 className="font-medium text-foreground">{service.name}</h4>
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDuration(service.duration_minutes)}</span>
          <span>·</span>
          <span className="font-medium text-foreground">
            {formatPrice(service.price, service.currency)}
          </span>
        </div>
      </div>
    </button>
  );
}
