"use client";

import { AlertTriangle, EyeOff } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";

interface HiddenServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundleName: string;
  hiddenServices: string[];
  translations: {
    title: string;
    description: string;
    hiddenServicesLabel: string;
    hint: string;
    close: string;
  };
}

export function HiddenServicesDialog({
  open,
  onOpenChange,
  bundleName,
  hiddenServices,
  translations: t,
}: HiddenServicesDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t.title}
          </div>
        </Dialog.Header>
        <Dialog.Body>
          <div className="space-y-4">
            <p className="text-muted">
              {t.description.replace("{bundleName}", bundleName)}
            </p>

            <div className="rounded-lg border border-border bg-surface-secondary p-3">
              <p className="mb-2 text-sm font-medium">
                {t.hiddenServicesLabel}
              </p>
              <ul className="space-y-2">
                {hiddenServices.map((serviceName) => (
                  <li key={serviceName} className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-muted" />
                    <span className="text-sm">{serviceName}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-muted">{t.hint}</p>
          </div>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
