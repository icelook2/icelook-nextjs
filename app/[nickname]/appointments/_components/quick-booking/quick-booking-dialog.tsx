"use client";

import { format } from "date-fns";
import { Loader2, Search, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import type { BeautyPageClient } from "@/lib/queries/clients";
import type { ServiceGroupWithServices } from "@/lib/queries/services";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { createQuickBooking } from "../../_actions/quick-booking.actions";
import { StepClient } from "./step-client";
import { StepConfirm } from "./step-confirm";
import { StepServices } from "./step-services";

// ============================================================================
// Types
// ============================================================================

export type QuickBookingStep = "client" | "services" | "confirm";

export interface SelectedSlot {
  startTime: string;
  maxDurationMinutes: number;
}

interface QuickBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beautyPageId: string;
  nickname: string;
  date: Date;
  slot: SelectedSlot;
  serviceGroups: ServiceGroupWithServices[];
  clients: BeautyPageClient[];
  currency: string;
}

// ============================================================================
// State
// ============================================================================

interface QuickBookingState {
  step: QuickBookingStep;
  // Client step
  clientMode: "guest" | "existing";
  selectedClient: BeautyPageClient | null;
  // Services step
  selectedServiceIds: string[];
  // Confirm step
  notes: string;
}

const initialState: QuickBookingState = {
  step: "client",
  clientMode: "guest",
  selectedClient: null,
  selectedServiceIds: [],
  notes: "",
};

// ============================================================================
// Component
// ============================================================================

export function QuickBookingDialog({
  open,
  onOpenChange,
  beautyPageId,
  nickname,
  date,
  slot,
  serviceGroups,
  clients,
  currency,
}: QuickBookingDialogProps) {
  const [state, setState] = useState<QuickBookingState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showServiceSearch, setShowServiceSearch] = useState(false);

  // Flatten services for lookup
  const allServices = serviceGroups.flatMap((g) => g.services);

  // Get selected services
  const selectedServices = allServices.filter((s) =>
    state.selectedServiceIds.includes(s.id),
  );

  // Calculate totals
  const totalDurationMinutes = selectedServices.reduce(
    (sum, s) => sum + s.duration_minutes,
    0,
  );
  const totalPriceCents = selectedServices.reduce(
    (sum, s) => sum + s.price_cents,
    0,
  );

  // Calculate end time
  const endTime = calculateEndTime(slot.startTime, totalDurationMinutes);

  // Reset state when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setState(initialState);
      setError(null);
      setShowClientSearch(false);
      setShowServiceSearch(false);
    }
    onOpenChange(open);
  };

  // Navigation
  const goToStep = (step: QuickBookingStep) => {
    setState((prev) => ({ ...prev, step }));
    setError(null);
  };

  const handleBack = () => {
    if (state.step === "services") {
      goToStep("client");
    } else if (state.step === "confirm") {
      goToStep("services");
    }
  };

  // Client step handlers
  const handleSelectClient = (client: BeautyPageClient) => {
    setState((prev) => ({
      ...prev,
      clientMode: "existing",
      selectedClient: client,
    }));
  };

  const handleGuestMode = () => {
    setState((prev) => ({
      ...prev,
      clientMode: "guest",
      selectedClient: null,
    }));
  };

  // Services step handlers
  const handleToggleService = (serviceId: string) => {
    setState((prev) => {
      const isSelected = prev.selectedServiceIds.includes(serviceId);
      return {
        ...prev,
        selectedServiceIds: isSelected
          ? prev.selectedServiceIds.filter((id) => id !== serviceId)
          : [...prev.selectedServiceIds, serviceId],
      };
    });
  };

  // Confirm step handlers
  const handleNotesChange = (notes: string) => {
    setState((prev) => ({ ...prev, notes }));
  };

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      // Build client info
      const clientName =
        state.clientMode === "existing" && state.selectedClient
          ? state.selectedClient.clientName
          : "Guest";

      const clientPhone =
        state.clientMode === "existing" && state.selectedClient
          ? state.selectedClient.clientPhone
          : "";

      const clientId =
        state.clientMode === "existing" && state.selectedClient
          ? state.selectedClient.clientId
          : null;

      const result = await createQuickBooking({
        beautyPageId,
        nickname,
        date: format(date, "yyyy-MM-dd"),
        startTime: slot.startTime,
        endTime,
        serviceIds: state.selectedServiceIds,
        clientId: clientId ?? undefined,
        clientName,
        clientPhone: clientPhone || undefined,
        notes: state.notes || undefined,
      });

      if (result.success) {
        handleOpenChange(false);
      } else {
        setError(result.error ?? "Failed to create booking");
      }
    });
  };

  // Validation
  const canProceedFromClient =
    state.clientMode === "guest" || state.selectedClient !== null;

  const canProceedFromServices = state.selectedServiceIds.length > 0;

  // Get client display info for later steps
  const clientDisplayName =
    state.clientMode === "existing" && state.selectedClient
      ? state.selectedClient.clientName
      : "Guest";

  const clientDisplayPhone =
    state.clientMode === "existing" && state.selectedClient
      ? state.selectedClient.clientPhone
      : undefined;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={open} size="md">
        <Dialog.Header
          onClose={() => handleOpenChange(false)}
          showBackButton={state.step !== "client"}
          onBack={handleBack}
          subtitle={
            state.step === "client" ? (
              `${slot.startTime} · ${slot.maxDurationMinutes}min available`
            ) : state.step === "confirm" ? (
              format(date, "EEEE, MMMM d")
            ) : (
              <div className="flex items-center gap-2">
                {state.clientMode === "guest" ? (
                  <>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                      <UserPlus className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span>Guest</span>
                  </>
                ) : (
                  <>
                    <Avatar name={clientDisplayName} size="xs" />
                    <span>{clientDisplayName}</span>
                  </>
                )}
              </div>
            )
          }
          action={
            state.step === "client" ? (
              <button
                type="button"
                onClick={() => setShowClientSearch(!showClientSearch)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  showClientSearch
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
                aria-label="Toggle search"
              >
                <Search className="h-5 w-5" />
              </button>
            ) : state.step === "services" ? (
              <button
                type="button"
                onClick={() => setShowServiceSearch(!showServiceSearch)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  showServiceSearch
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
                aria-label="Toggle search"
              >
                <Search className="h-5 w-5" />
              </button>
            ) : undefined
          }
        >
          Book Appointment
        </Dialog.Header>

        <Dialog.Body className="p-0">
          {state.step === "client" && (
            <StepClient
              clients={clients}
              clientMode={state.clientMode}
              selectedClient={state.selectedClient}
              onSelectClient={handleSelectClient}
              onGuestMode={handleGuestMode}
              showSearch={showClientSearch}
            />
          )}

          {state.step === "services" && (
            <StepServices
              serviceGroups={serviceGroups}
              selectedServiceIds={state.selectedServiceIds}
              currency={currency}
              onToggleService={handleToggleService}
              showSearch={showServiceSearch}
            />
          )}

          {state.step === "confirm" && (
            <StepConfirm
              date={date}
              startTime={slot.startTime}
              endTime={endTime}
              clientName={clientDisplayName}
              clientPhone={clientDisplayPhone}
              selectedServices={selectedServices}
              totalPriceCents={totalPriceCents}
              currency={currency}
              notes={state.notes}
              onNotesChange={handleNotesChange}
              error={error}
            />
          )}
        </Dialog.Body>

        <Dialog.Footer className="justify-end">
          {state.step === "client" && (
            <Button
              onClick={() => goToStep("services")}
              disabled={!canProceedFromClient}
            >
              Next
            </Button>
          )}

          {state.step === "services" && (
            <Button
              onClick={() => goToStep("confirm")}
              disabled={!canProceedFromServices}
            >
              Next
            </Button>
          )}

          {state.step === "confirm" && (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book now
            </Button>
          )}
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}
