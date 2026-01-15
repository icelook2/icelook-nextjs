"use client";

import { Check, Search, UserPlus } from "lucide-react";
import { useDeferredValue, useState } from "react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Avatar } from "@/lib/ui/avatar";

interface StepClientProps {
  clients: BeautyPageClient[];
  clientMode: "guest" | "existing";
  selectedClient: BeautyPageClient | null;
  onSelectClient: (client: BeautyPageClient) => void;
  onGuestMode: () => void;
  showSearch: boolean;
}

export function StepClient({
  clients,
  clientMode,
  selectedClient,
  onSelectClient,
  onGuestMode,
  showSearch,
}: StepClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  // Clear search when hiding
  const effectiveSearch = showSearch ? deferredSearch : "";

  // Filter clients based on search
  const filteredClients = clients.filter((client) => {
    if (!effectiveSearch) {
      return true;
    }
    const searchLower = effectiveSearch.toLowerCase();
    return (
      client.clientName.toLowerCase().includes(searchLower) ||
      client.clientPhone.includes(effectiveSearch)
    );
  });

  return (
    <div>
      {/* Sticky search - only shown when showSearch is true */}
      {showSearch && (
        <div className="sticky top-0 isolate bg-surface px-4 pb-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search clients by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      )}

      {/* Scrollable list - Guest first, then clients */}
      <div className={`pb-4 ${!showSearch ? "pt-2" : ""}`}>
        {/* Guest option - shows when search is empty or matches "guest" */}
        {(!effectiveSearch ||
          "guest".includes(effectiveSearch.toLowerCase())) && (
          <button
            type="button"
            onClick={onGuestMode}
            className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
              clientMode === "guest"
                ? "border-l-accent bg-accent/5"
                : "border-l-transparent hover:bg-surface-hover"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="min-w-0 flex-1 font-medium">Guest</span>
            {/* Radio indicator */}
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                clientMode === "guest"
                  ? "border-accent bg-accent"
                  : "border-border"
              }`}
            >
              {clientMode === "guest" && (
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              )}
            </div>
          </button>
        )}

        {/* Clients */}
        {filteredClients.map((client) => {
          const isSelected =
            clientMode === "existing" &&
            selectedClient?.clientKey === client.clientKey;

          return (
            <button
              key={client.clientKey}
              type="button"
              onClick={() => onSelectClient(client)}
              className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "border-l-accent bg-accent/5"
                  : "border-l-transparent hover:bg-surface-hover"
              }`}
            >
              <Avatar name={client.clientName} size="sm" />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="font-medium">
                  {client.clientName}
                </span>
                {client.isGuest && (
                  <span className="rounded bg-muted/20 px-1.5 py-0.5 text-xs text-muted">
                    Guest
                  </span>
                )}
              </div>
              {/* Radio indicator */}
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-accent bg-accent" : "border-border"
                }`}
              >
                {isSelected && (
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                )}
              </div>
            </button>
          );
        })}

        {/* No results message */}
        {filteredClients.length === 0 &&
          effectiveSearch &&
          !"guest".includes(effectiveSearch.toLowerCase()) && (
            <p className="py-4 text-center text-sm text-muted">
              No clients found
            </p>
          )}
      </div>
    </div>
  );
}
