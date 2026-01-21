"use client";

import { useTranslations } from "next-intl";
import type { BeautyPageSearchResult } from "@/lib/queries/search";
import { EmptyStateVariants } from "./empty-state-variants";
import { SearchResultCard } from "./search-result-card";

interface SearchResultsProps {
  results: BeautyPageSearchResult[];
  query: string;
  isLoading: boolean;
}

export function SearchResults({
  results,
  query,
  isLoading,
}: SearchResultsProps) {
  const t = useTranslations("search");

  // Empty state: no query yet
  if (!query || query.trim().length < 2) {
    return <EmptyStateVariants message={t("empty_prompt")} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // No results
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16">
        <p className="text-center text-sm text-muted">
          {t("no_results", { query })}
        </p>
      </div>
    );
  }

  // Results
  return (
    <div className="grid gap-1" aria-label={t("results_label")}>
      {results.map((result) => (
        <SearchResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}
