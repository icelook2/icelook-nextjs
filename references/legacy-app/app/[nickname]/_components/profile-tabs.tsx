"use client";

/**
 * Profile Tabs - Tab navigation for beauty page sections
 *
 * Uses state-based styling (like FilterCapsules) for consistent
 * behavior across all browsers including Safari mobile.
 */

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface ProfileTabsProps {
  servicesContent: ReactNode;
  reviewsContent: ReactNode;
  contactsContent: ReactNode;
  servicesCount: number;
  reviewsCount: number;
  translations: {
    services: string;
    reviews: string;
    contacts: string;
  };
}

type TabValue = "services" | "reviews" | "contacts";

export function ProfileTabs({
  servicesContent,
  reviewsContent,
  contactsContent,
  servicesCount,
  reviewsCount,
  translations,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("services");

  const tabs: { value: TabValue; label: string; count: number | null }[] = [
    { value: "services", label: translations.services, count: servicesCount },
    { value: "reviews", label: translations.reviews, count: reviewsCount },
    { value: "contacts", label: translations.contacts, count: null },
  ];

  const contentMap: Record<TabValue, ReactNode> = {
    services: servicesContent,
    reviews: reviewsContent,
    contacts: contactsContent,
  };

  return (
    <div>
      {/* Tab list */}
      <div className="flex gap-2" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface hover:bg-surface-hover",
              )}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panel */}
      <div className="mt-4" role="tabpanel">
        {contentMap[activeTab]}
      </div>
    </div>
  );
}
