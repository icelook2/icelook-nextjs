"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { BeautyPageSearchResult } from "@/lib/queries/search";
import { searchAction } from "../_actions";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";

const DEBOUNCE_MS = 300;

export function SearchContainer() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BeautyPageSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If query is empty or too short, clear results
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    // Set new debounce timeout
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchAction(query);
        if (result.success) {
          setResults(result.results);
        }
      });
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  function handleClear() {
    setQuery("");
    setResults([]);
  }

  return (
    <div className="space-y-6">
      <SearchInput
        value={query}
        onChange={setQuery}
        onClear={handleClear}
        isPending={isPending}
      />
      <SearchResults results={results} query={query} isLoading={isPending} />
    </div>
  );
}
