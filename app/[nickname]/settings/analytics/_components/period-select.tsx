"use client";

import { useTranslations } from "next-intl";
import { Select, type SelectItem } from "@/lib/ui/select";
import type { AnalyticsPeriod } from "../_lib/types";
import { useAnalytics } from "./analytics-context";

const PERIOD_OPTIONS: AnalyticsPeriod[] = [
  "today",
  "yesterday",
  "this_week",
  "last_7_days",
  "this_month",
  "last_30_days",
  "this_quarter",
  "last_quarter",
  "this_year",
  "last_year",
  "all_time",
];

export function PeriodSelect() {
  const t = useTranslations("analytics.period");
  const { period, setPeriod } = useAnalytics();

  const items: SelectItem[] = PERIOD_OPTIONS.map((p) => ({
    value: p,
    label: t(p),
  }));

  return (
    <Select.Root
      value={period}
      onValueChange={(value) => setPeriod(value as AnalyticsPeriod)}
    >
      <Select.Trigger
        className="w-auto min-w-[160px] py-2 text-sm"
        items={items}
      />
      <Select.Content>
        {items.map((item) => (
          <Select.Item key={item.value} value={item.value}>
            {item.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
