"use client";

import Link from "next/link";
import { Button } from "@/lib/ui/button";

interface WizardButtonsProps {
  backHref?: string;
  backLabel: string;
  nextLabel: string;
  isSubmitting?: boolean;
  onSubmit?: () => void;
}

export function WizardButtons({
  backHref,
  backLabel,
  nextLabel,
  isSubmitting,
  onSubmit,
}: WizardButtonsProps) {
  return (
    <div className="flex justify-between gap-4 pt-4">
      {backHref ? (
        <Button variant="ghost" render={<Link href={backHref} />}>
          {backLabel}
        </Button>
      ) : (
        <div />
      )}
      <Button
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        loading={isSubmitting}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
