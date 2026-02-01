"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchHistory } from "@/lib/hooks";
import type { BeautyPageSearchResult } from "@/lib/queries/search";
import { Button } from "@/lib/ui/button";
import { searchAction } from "../_actions";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";
import { FilteredHistoryResults } from "./filtered-history-results";

const DEBOUNCE_MS = 300;

export function SearchContainer() {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<BeautyPageSearchResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, startLoadingMore] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastUrlQuery = useRef(initialQuery);

  // Search history for empty query display
  const { recentlyViewed, removeViewedPage, clearHistory } = useSearchHistory();

  const trimmedQuery = query.trim();

  // Whether to show history (empty query with history)
  const showHistory = trimmedQuery.length === 0 && recentlyViewed.length > 0;

  // Debounced search effect (any non-empty query)
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If query is empty, clear API results and URL param
    if (!query || query.trim().length < 1) {
      setResults([]);
      setHasMore(false);
      if (lastUrlQuery.current) {
        lastUrlQuery.current = "";
        router.replace("/search", { scroll: false });
      }
      return;
    }

    // Set new debounce timeout for API search
    debounceRef.current = setTimeout(() => {
      // Update URL with query only if changed
      if (lastUrlQuery.current !== query) {
        lastUrlQuery.current = query;
        router.replace(`/search?q=${encodeURIComponent(query)}`, {
          scroll: false,
        });
      }

      startTransition(async () => {
        const result = await searchAction(query, 0);
        if (result.success) {
          setResults(result.results);
          setHasMore(result.hasMore);
        }
      });
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, router]);

  function handleClear() {
    setQuery("");
    setResults([]);
    setHasMore(false);
    lastUrlQuery.current = "";
    router.replace("/search", { scroll: false });
  }

  function handleLoadMore() {
    startLoadingMore(async () => {
      const result = await searchAction(query, results.length);
      if (result.success) {
        setResults((prev) => [...prev, ...result.results]);
        setHasMore(result.hasMore);
      }
    });
  }

  return (
    <div className="space-y-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        onClear={handleClear}
        isPending={isPending}
      />
      <div>
        {/* Recent history (empty query only) */}
        {showHistory && (
          <FilteredHistoryResults
            pages={recentlyViewed}
            title={t("recent")}
            onRemove={removeViewedPage}
            onClearAll={clearHistory}
          />
        )}

        {/* API search results (any non-empty query) */}
        {!showHistory && (
          <>
            <SearchResults
              results={results}
              query={query}
              isLoading={isPending}
            />

            {/* Load More Button or End of List */}
            {results.length > 0 && (
              <div className="flex justify-center pt-4">
                {hasMore ? (
                  <Button
                    variant="soft"
                    size="icon"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                ) : (
                  <p className="text-sm text-muted">{t("end_of_list")}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
