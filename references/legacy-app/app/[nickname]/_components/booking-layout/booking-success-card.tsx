"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/lib/ui/button";

interface BookingSuccessCardProps {
  title: string;
  status: "pending" | "confirmed";
  translations: {
    successTitle: string;
    confirmedMessage: string;
    pendingMessage: string;
    bookAnother: string;
  };
  onBookAnother: () => void;
}

export function BookingSuccessCard({
  title,
  status,
  translations: t,
  onBookAnother,
}: BookingSuccessCardProps) {
  return (
    <div>
      <div className="pb-3">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>

        <h4 className="mb-2 text-lg font-semibold">{t.successTitle}</h4>

        <p className="mb-6 text-sm text-muted">
          {status === "confirmed" ? t.confirmedMessage : t.pendingMessage}
        </p>

        <Button variant="secondary" onClick={onBookAnother} className="w-full">
          {t.bookAnother}
        </Button>
      </div>
    </div>
  );
}
