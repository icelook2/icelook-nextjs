"use client";

import { AlertDialog } from "@/lib/ui/alert-dialog";
import { Button } from "@/lib/ui/button";

export type ActionType = "confirm" | "complete" | "cancel" | "no_show";

export interface ActionConfirmationTranslations {
  confirm: {
    title: string;
    message: string;
    yes: string;
  };
  complete: {
    title: string;
    message: string;
    yes: string;
  };
  cancel: {
    title: string;
    message: string;
    yes: string;
  };
  no_show: {
    title: string;
    message: string;
    yes: string;
  };
  keep: string;
}

interface ActionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  actionType: ActionType;
  clientName: string;
  isPending?: boolean;
  translations: ActionConfirmationTranslations;
}

export function ActionConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  actionType,
  clientName,
  isPending = false,
  translations,
}: ActionConfirmationDialogProps) {
  const config = translations[actionType];

  // Determine button variant based on action type
  const buttonVariant =
    actionType === "cancel" || actionType === "no_show" ? "danger" : "primary";

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal open={open}>
        <AlertDialog.Title>{config.title}</AlertDialog.Title>
        <AlertDialog.Description>
          {config.message.replace("{client}", clientName)}
        </AlertDialog.Description>

        <AlertDialog.Actions className="mt-6 flex-col gap-2 sm:flex-row">
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            loading={isPending}
            disabled={isPending}
            className="w-full sm:order-2 sm:w-auto"
          >
            {config.yes}
          </Button>
          <AlertDialog.Close
            render={
              <Button
                variant="secondary"
                disabled={isPending}
                className="w-full sm:order-1 sm:w-auto"
              >
                {translations.keep}
              </Button>
            }
          />
        </AlertDialog.Actions>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
