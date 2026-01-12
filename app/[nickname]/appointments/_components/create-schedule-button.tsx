"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";

/**
 * Button to open the Create Schedule dialog
 * Renders a + icon button for the page header
 */
export function CreateScheduleButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label="Create schedule"
            className="aspect-square p-2"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />
      <Dialog.Portal open={open} size="sm">
        <Dialog.Header onClose={() => setOpen(false)}>
          Create Schedule
        </Dialog.Header>
        <Dialog.Body>
          <p className="text-sm text-muted">
            Configure your working schedule for the upcoming days.
          </p>

          {/* TODO: Add schedule configuration form */}
          <div className="mt-4 rounded-lg border border-border bg-surface-alt p-8 text-center">
            <p className="text-sm text-muted">
              Schedule configuration coming soon...
            </p>
          </div>
        </Dialog.Body>
        <Dialog.Footer className="justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
