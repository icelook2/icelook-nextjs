"use client";

import type { LucideIcon } from "lucide-react";
import { Paper } from "@/lib/ui/paper";
import { MetricInfoPopover } from "./metric-info-popover";
import { TrendBadge } from "./trend-badge";

interface TrendData {
  value: number;
  invertColor?: boolean;
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  trend?: TrendData | null;
  infoKey?: string;
}

export function MetricCard({
  label,
  value,
  // icon: Icon,
  // iconClassName,
  trend,
  infoKey,
}: MetricCardProps) {
  const hasTrend = trend !== undefined && trend !== null;

  return (
    <Paper className="p-4">
      {/* Header: label + info */}
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-on-surface-muted">{label}</p>
        {infoKey && <MetricInfoPopover infoKey={infoKey} />}
      </div>

      {/* Value + Trend */}
      <div className="flex items-center gap-2">
        <p className="text-3xl font-bold text-on-surface">{value}</p>
        {hasTrend && (
          <TrendBadge value={trend.value} invertColor={trend.invertColor} />
        )}
      </div>
    </Paper>
  );
}
