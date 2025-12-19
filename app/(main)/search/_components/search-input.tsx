"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/lib/ui/input";

interface SearchInputProps {
  defaultValue?: string;
}

export function SearchInput({ defaultValue = "" }: SearchInputProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip URL update on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear previous timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce URL update
    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }

      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      startTransition(() => {
        router.push(newUrl, { scroll: false });
      });
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, pathname, router, searchParams]);

  function handleClear() {
    setValue("");
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  return (
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40"
        aria-hidden="true"
      />
      <Input
        type="text"
        placeholder={t("placeholder")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-12 pr-12"
        autoFocus
        aria-label={t("aria_label")}
      />
      {isPending ? (
        <Loader2
          className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-foreground/40"
          aria-hidden="true"
        />
      ) : value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground/60"
          aria-label={t("clear")}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
