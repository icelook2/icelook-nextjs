"use client";

import { ChevronDown, Loader2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Button } from "@/lib/ui/button";
import { SettingsGroup } from "@/lib/ui/settings-group";
import { loadClients } from "../_actions/clients.actions";
import { ClientRow } from "./client-row";
import { ClientSearch } from "./client-search";

interface ClientsListProps {
  initialClients: BeautyPageClient[];
  initialTotal: number;
  initialHasMore: boolean;
  /** Page size from server - used for subsequent requests */
  pageSize: number;
  nickname: string;
}

export function ClientsList({
  initialClients,
  initialTotal,
  initialHasMore,
  pageSize,
  nickname,
}: ClientsListProps) {
  const t = useTranslations("clients");

  // State for clients list
  const [clients, setClients] = useState(initialClients);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);

  // State for search
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State for load more
  const [isPending, startTransition] = useTransition();

  // Debounce timer for search
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search with debounce (React Compiler handles optimization)
  function handleSearchChange(value: string) {
    setSearch(value);

    // Clear existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Debounce search
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);

      const result = await loadClients({
        nickname,
        search: value || undefined,
        offset: 0,
        limit: pageSize,
      });

      setClients(result.clients);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setIsSearching(false);
    }, 300);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Handle load more
  function handleLoadMore() {
    startTransition(async () => {
      const result = await loadClients({
        nickname,
        search: search || undefined,
        offset: clients.length,
        limit: pageSize,
      });

      // Append new clients to existing list
      setClients((prev) => [...prev, ...result.clients]);
      setTotal(result.total);
      setHasMore(result.hasMore);
    });
  }

  // No clients at all (not searching)
  if (initialTotal === 0 && !search) {
    return (
      <SettingsGroup>
        <EmptyState hasSearch={false} />
      </SettingsGroup>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and count */}
      <div className="space-y-2">
        <ClientSearch value={search} onChange={handleSearchChange} />
        {clients.length > 0 && (
          <p className="text-right text-sm text-muted">
            {t("showing_count", { shown: clients.length, total })}
          </p>
        )}
      </div>

      {/* Clients List */}
      <SettingsGroup>
        {isSearching ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState hasSearch={true} />
        ) : (
          clients.map((client, index) => (
            <ClientRow
              key={client.clientId}
              client={client}
              nickname={nickname}
              noBorder={index === clients.length - 1}
            />
          ))
        )}
      </SettingsGroup>

      {/* Load More Button or End of List message */}
      {clients.length > 0 && (
        <div className="flex justify-center pt-2">
          {hasMore ? (
            <Button
              variant="soft"
              size="icon"
              onClick={handleLoadMore}
              disabled={isPending}
            >
              {isPending ? (
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
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  const t = useTranslations("clients.empty");

  // Different message if filtering vs no clients at all
  if (hasSearch) {
    return (
      <div className="p-8 text-center">
        <Users className="mx-auto h-12 w-12 text-muted" />
        <h3 className="mt-4 font-semibold">{t("no_results_title")}</h3>
        <p className="mt-2 text-sm text-muted">{t("no_results_description")}</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-center">
      <Users className="mx-auto h-12 w-12 text-muted" />
      <h3 className="mt-4 font-semibold">{t("title")}</h3>
      <p className="mt-2 text-sm text-muted">{t("description")}</p>
    </div>
  );
}
