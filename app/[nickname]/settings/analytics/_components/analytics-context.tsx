"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import type { AnalyticsData, AnalyticsPeriod } from "../_lib/types";

type AnalyticsContextValue = {
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  analytics: AnalyticsData;
  nickname: string;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  analytics: AnalyticsData;
  nickname: string;
}

export function AnalyticsProvider({
  children,
  analytics,
  nickname,
}: AnalyticsProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setPeriod = useCallback(
    (period: AnalyticsPeriod) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", period);
      router.push(`/${nickname}/settings/analytics?${params.toString()}`);
    },
    [router, searchParams, nickname],
  );

  const value = useMemo(
    () => ({
      period: analytics.period.type,
      setPeriod,
      analytics,
      nickname,
    }),
    [analytics, setPeriod, nickname],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
}
