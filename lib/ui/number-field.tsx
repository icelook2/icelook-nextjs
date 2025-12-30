"use client";

import {
  NumberField as BaseNumberField,
  type NumberFieldRootProps,
} from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

const inputClassName =
  "w-full appearance-none bg-transparent text-center text-sm tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const buttonClassName =
  "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

const groupClassName =
  "flex items-center gap-1 rounded-2xl border border-border bg-background px-2 py-1.5 transition-colors focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent";

type NumberFieldProps = Omit<NumberFieldRootProps, "render"> & {
  className?: string;
};

export function NumberField({
  className,
  children,
  ...props
}: NumberFieldProps) {
  return (
    <BaseNumberField.Root {...props}>
      <BaseNumberField.Group className={cn(groupClassName, className)}>
        <BaseNumberField.Decrement className={buttonClassName}>
          <Minus className="size-4" />
        </BaseNumberField.Decrement>
        <BaseNumberField.Input className={inputClassName} />
        <BaseNumberField.Increment className={buttonClassName}>
          <Plus className="size-4" />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}

// Export parts for custom compositions
export const NumberFieldRoot = BaseNumberField.Root;
export const NumberFieldGroup = BaseNumberField.Group;
export const NumberFieldInput = BaseNumberField.Input;
export const NumberFieldIncrement = BaseNumberField.Increment;
export const NumberFieldDecrement = BaseNumberField.Decrement;
export const NumberFieldScrubArea = BaseNumberField.ScrubArea;
export const NumberFieldScrubAreaCursor = BaseNumberField.ScrubAreaCursor;

// Re-export types
export type { NumberFieldRootProps };
export type NumberFieldGroupProps = ComponentPropsWithoutRef<
  typeof BaseNumberField.Group
>;
export type NumberFieldInputProps = ComponentPropsWithoutRef<
  typeof BaseNumberField.Input
>;
