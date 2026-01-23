"use client";

import { Ban, ChevronDown, Loader2, Plus, Search, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Input } from "@/lib/ui/input";
import { blockClientAction } from "../../clients/_actions/blocklist.actions";
import { loadClients } from "../../clients/_actions/clients.actions";

// ============================================================================
// Types
// ============================================================================

interface BlockClientButtonProps {
  beautyPageId: string;
  nickname: string;
}

// ============================================================================
// Component
// ============================================================================

export function BlockClientButton({
  beautyPageId,
  nickname,
}: BlockClientButtonProps) {
  const t = useTranslations("blocked_clients");

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"search" | "confirm">("search");
  const [selectedClient, setSelectedClient] = useState<BeautyPageClient | null>(
    null,
  );

  // Search state
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<BeautyPageClient[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Block action state
  const [isBlocking, startBlockTransition] = useTransition();

  // Load initial clients when dialog opens
  useEffect(() => {
    if (isOpen && clients.length === 0 && !isSearching) {
      loadInitialClients();
    }
  }, [isOpen, clients.length, isSearching]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  async function loadInitialClients() {
    setIsSearching(true);
    const result = await loadClients({
      nickname,
      limit: 10,
      offset: 0,
    });
    setClients(result.clients);
    setTotal(result.total);
    setHasMore(result.hasMore);
    setIsSearching(false);
  }

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
        limit: 10,
      });

      setClients(result.clients);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setIsSearching(false);
    }, 300);
  }

  async function handleLoadMore() {
    setIsLoadingMore(true);

    const result = await loadClients({
      nickname,
      search: search || undefined,
      offset: clients.length,
      limit: 10,
    });

    setClients((prev) => [...prev, ...result.clients]);
    setTotal(result.total);
    setHasMore(result.hasMore);
    setIsLoadingMore(false);
  }

  function handleSelectClient(client: BeautyPageClient) {
    setSelectedClient(client);
    setStep("confirm");
  }

  function handleBack() {
    setStep("search");
    setSelectedClient(null);
  }

  function handleClose() {
    setIsOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStep("search");
      setSelectedClient(null);
      setSearch("");
    }, 300);
  }

  function handleBlock() {
    if (!selectedClient) {
      return;
    }

    startBlockTransition(async () => {
      await blockClientAction(beautyPageId, selectedClient.clientId);
      handleClose();
    });
  }

  return (
    <>
      <Button
        variant="primary"
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        {t("block_button")}
      </Button>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal open={isOpen} size="md">
          {step === "search" ? (
            <>
              <Dialog.Header onClose={handleClose}>
                {t("dialog_title")}
              </Dialog.Header>
              <Dialog.Body className="space-y-4 p-4">
                {/* Search input */}
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={t("search_placeholder")}
                    className="pl-9 pr-9"
                    autoComplete="off"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
                      aria-label={t("clear_search")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Clients list */}
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted" />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="py-8 text-center">
                    <Ban className="mx-auto h-12 w-12 text-muted" />
                    <p className="mt-4 text-sm text-muted">
                      {search ? t("no_results") : t("no_clients")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Show count */}
                    <p className="text-right text-xs text-muted">
                      {t("showing_count", { shown: clients.length, total })}
                    </p>

                    {/* Client rows */}
                    <div className="rounded-lg border border-default">
                      {clients.map((client, index) => (
                        <button
                          key={client.clientId}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover ${
                            index !== clients.length - 1
                              ? "border-b border-default"
                              : ""
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-hover text-sm font-medium">
                            {client.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{client.clientName}</p>
                            {client.clientEmail && (
                              <p className="text-sm text-muted truncate">
                                {client.clientEmail}
                              </p>
                            )}
                          </div>
                          <Plus className="h-4 w-4 text-muted" />
                        </button>
                      ))}
                    </div>

                    {/* Load more */}
                    {hasMore && (
                      <div className="flex justify-center pt-2">
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
                      </div>
                    )}
                  </div>
                )}
              </Dialog.Body>
            </>
          ) : (
            <>
              <Dialog.Header
                onClose={handleClose}
                onBack={handleBack}
                showBackButton
              >
                {t("confirm_title")}
              </Dialog.Header>
              <Dialog.Body className="space-y-4">
                {/* Selected client info */}
                <div className="flex items-center gap-3 rounded-lg border border-default p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <Ban className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedClient?.clientName}</p>
                    {selectedClient?.clientEmail && (
                      <p className="text-sm text-muted truncate">
                        {selectedClient.clientEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Warning message */}
                <p className="text-sm text-muted">
                  {t("confirm_description", {
                    name: selectedClient?.clientName ?? "",
                  })}
                </p>
              </Dialog.Body>
              <Dialog.Footer className="justify-end">
                <Button variant="soft" onClick={handleBack} disabled={isBlocking}>
                  {t("cancel")}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBlock}
                  disabled={isBlocking}
                >
                  {isBlocking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("confirm_block")}
                </Button>
              </Dialog.Footer>
            </>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
