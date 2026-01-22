"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import type { BeautyPageSearchResult } from "@/lib/queries/search";
import { Button } from "@/lib/ui/button";
import { searchAction } from "../_actions";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";

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

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If query is empty or too short, clear results and URL param
    if (!query || query.trim().length < 2) {
      setResults([]);
      setHasMore(false);
      if (lastUrlQuery.current) {
        lastUrlQuery.current = "";
        router.replace("/search", { scroll: false });
      }
      return;
    }

    // Set new debounce timeout
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
        <SearchResults results={results} query={query} isLoading={isPending} />

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
      </div>
    </div>
  );
}
