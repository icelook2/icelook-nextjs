"use client";

import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

interface OtpInputProps
  extends Omit<
    ComponentPropsWithoutRef<typeof OTPInput>,
    "render" | "maxLength" | "pattern" | "children"
  > {
  /** Number of OTP digits */
  length?: number;
  /** Show error styling */
  error?: boolean;
}

export function OtpInput({
  length = 6,
  error = false,
  className,
  ...props
}: OtpInputProps) {
  return (
    <OTPInput
      maxLength={length}
      pattern={REGEXP_ONLY_DIGITS}
      containerClassName={cn("flex w-full items-center gap-2", className)}
      {...props}
      render={({ slots }) => (
        <div className="flex w-full items-center gap-2">
          {slots.map((slot, idx) => (
            <Slot key={idx} {...slot} error={error} />
          ))}
        </div>
      )}
    />
  );
}

interface SlotProps {
  char: string | null;
  hasFakeCaret: boolean;
  isActive: boolean;
  error?: boolean;
}

function Slot({ char, hasFakeCaret, isActive, error }: SlotProps) {
  return (
    <div
      className={cn(
        "relative flex h-14 flex-1 items-center justify-center rounded-xl border text-xl font-medium transition-all",
        "bg-background",
        error
          ? "border-danger"
          : isActive
            ? "border-accent ring-2 ring-accent"
            : "border-border",
      )}
    >
      {char}
      {hasFakeCaret && <FakeCaret />}
    </div>
  );
}

function FakeCaret() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="h-6 w-0.5 animate-caret-blink bg-foreground" />
    </div>
  );
}
