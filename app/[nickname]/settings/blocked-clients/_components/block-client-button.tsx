"use client";

import {
  Ban,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  UserPlus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
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
  const deferredSearch = useDeferredValue(search);
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
              <Dialog.Header
                onClose={handleClose}
                subtitle={
                  total > 0
                    ? t("showing_count", { shown: clients.length, total })
                    : undefined
                }
                action={
                  selectedClient ? (
                    <button
                      type="button"
                      onClick={() => setStep("confirm")}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/10"
                      aria-label={t("confirm_title")}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  ) : undefined
                }
              >
                {t("dialog_title")}
              </Dialog.Header>

              <Dialog.Body className="p-0">
                {/* Clients list */}
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted" />
                  </div>
                ) : clients.length === 0 ? (
                  <div className="py-12 text-center">
                    <Ban className="mx-auto h-12 w-12 text-muted" />
                    <p className="mt-4 text-sm text-muted">
                      {deferredSearch ? t("no_results") : t("no_clients")}
                    </p>
                  </div>
                ) : (
                  <div className="pb-4 pt-2">
                    {/* Client rows */}
                    {clients.map((client) => {
                      const isSelected =
                        selectedClient?.clientId === client.clientId;

                      return (
                        <button
                          key={client.clientId}
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "border-l-accent bg-accent/5"
                              : "border-l-transparent hover:bg-surface-hover"
                          }`}
                        >
                          <Avatar
                            name={client.clientName}
                            url={client.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{client.clientName}</p>
                            {client.clientEmail && (
                              <p className="truncate text-sm text-muted">
                                {client.clientEmail}
                              </p>
                            )}
                          </div>
                          {/* Selection indicator */}
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isSelected
                                ? "border-accent bg-accent"
                                : "border-border"
                            }`}
                          >
                            {isSelected && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {/* Load more */}
                    {hasMore && (
                      <div className="flex justify-center pt-4">
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

              <Dialog.Footer className="flex-col gap-0 p-0 md:flex-row md:justify-end md:px-6 md:py-4">
                {/* Mobile: Search input in footer */}
                <div className="w-full border-t border-border p-4 md:hidden">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder={t("search_placeholder")}
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
                {/* Desktop: Search + Next button */}
                <div className="hidden items-center gap-3 md:flex">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder={t("search_placeholder")}
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-64 rounded-lg border border-border bg-surface py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <Button
                    onClick={() => setStep("confirm")}
                    disabled={!selectedClient}
                  >
                    {t("next")}
                  </Button>
                </div>
              </Dialog.Footer>
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
                <Button
                  variant="soft"
                  onClick={handleBack}
                  disabled={isBlocking}
                >
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
