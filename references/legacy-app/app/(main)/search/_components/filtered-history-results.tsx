"use client";

import { BadgeCheck, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { RecentlyViewedPage } from "@/lib/hooks";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";

interface FilteredHistoryResultsProps {
  pages: RecentlyViewedPage[];
  title: string;
  onRemove?: (pageId: string) => void;
  onClearAll?: () => void;
}

export function FilteredHistoryResults({
  pages,
  title,
  onRemove,
  onClearAll,
}: FilteredHistoryResultsProps) {
  const t = useTranslations("search");

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted">{title}</h3>
        {onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-muted hover:text-foreground"
          >
            {t("clear")}
          </Button>
        )}
      </div>

      {/* Results */}
      <div className="grid gap-1">
        {pages.map((page) => (
          <div key={page.id} className="group relative">
            <Link
              href={`/${page.slug}`}
              className="flex items-center gap-3 rounded-lg py-3 pr-10 transition-colors hover:bg-surface-hover"
            >
              <Avatar
                url={page.avatarUrl}
                name={page.name}
                size="md"
                shape="rounded"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1">
                  <span className="truncate font-semibold">{page.slug}</span>
                  {page.isVerified && (
                    <BadgeCheck
                      className="h-4 w-4 shrink-0 text-accent"
                      aria-label="Verified"
                    />
                  )}
                </div>
                <span className="truncate text-sm text-muted">
                  {page.displayName ?? page.name}
                </span>
              </div>
            </Link>

            {/* Remove button */}
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(page.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted opacity-0 transition-opacity hover:bg-surface-hover hover:text-foreground group-hover:opacity-100"
                aria-label={t("remove_from_history")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
