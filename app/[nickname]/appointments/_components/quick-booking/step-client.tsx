"use client";

import { Check, UserPlus } from "lucide-react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Avatar } from "@/lib/ui/avatar";

interface StepClientProps {
  clients: BeautyPageClient[];
  clientMode: "guest" | "existing";
  selectedClient: BeautyPageClient | null;
  onSelectClient: (client: BeautyPageClient) => void;
  onGuestMode: () => void;
  searchQuery: string;
}

export function StepClient({
  clients,
  clientMode,
  selectedClient,
  onSelectClient,
  onGuestMode,
  searchQuery,
}: StepClientProps) {

  // Filter clients based on search
  const filteredClients = clients.filter((client) => {
    if (!searchQuery) {
      return true;
    }
    const searchLower = searchQuery.toLowerCase();
    return (
      client.clientName.toLowerCase().includes(searchLower) ||
      client.clientPhone.includes(searchQuery)
    );
  });

  return (
    <div>
      {/* Scrollable list - Guest first, then clients */}
      <div className="pb-4 pt-2">
        {/* Guest option - shows when search is empty or matches "guest" */}
        {(!searchQuery || "guest".includes(searchQuery.toLowerCase())) && (
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
                <span className="font-medium">{client.clientName}</span>
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
          searchQuery &&
          !"guest".includes(searchQuery.toLowerCase()) && (
            <p className="py-4 text-center text-sm text-muted">
              No clients found
            </p>
          )}
      </div>
    </div>
  );
}
