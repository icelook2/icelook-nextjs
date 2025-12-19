"use client";

import {
  BookingProvider,
  type BookingService,
  type BookingSpecialist,
} from "@/lib/appointments";
import { Dialog } from "@/lib/ui/dialog";
import { BookingWizard } from "./booking-wizard";

interface BookingDialogProps {
  specialist: BookingSpecialist;
  services: BookingService[];
  isAuthenticated: boolean;
  userName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({
  specialist,
  services,
  isAuthenticated,
  userName,
  open,
  onOpenChange,
}: BookingDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSuccess = () => {
    // Keep dialog open to show success state
    // User can close manually
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal open={open} size="lg">
        <BookingProvider
          specialist={specialist}
          services={services}
          isAuthenticated={isAuthenticated}
          userName={userName}
        >
          <BookingWizard onClose={handleClose} onSuccess={handleSuccess} />
        </BookingProvider>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
