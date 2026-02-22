"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface SummaryRowProps {
  icon: ReactNode;
  label: string;
  completed: boolean;
  placeholder: string;
  children?: ReactNode;
}

export function SummaryRow({
  icon,
  label,
  completed,
  placeholder,
  children,
}: SummaryRowProps) {
  return (
    <div className="flex gap-3">
      {/* Status icon */}
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          completed ? "bg-accent/10 text-accent" : "bg-surface-hover text-muted"
        }`}
      >
        {completed ? <Check className="h-3.5 w-3.5" /> : icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted">{label}</div>
        {completed ? (
          children
        ) : (
          <div className="text-sm text-muted/60">{placeholder}</div>
        )}
      </div>
    </div>
  );
}
