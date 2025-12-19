"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

export const inputVariants = cva(
  "w-full px-4 py-3 rounded-full border bg-background text-foreground placeholder:text-foreground/40 transition-colors duration-150 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-foreground/5 disabled:text-foreground/40 disabled:cursor-not-allowed",
  {
    variants: {
      state: {
        default: "border-foreground/20 focus:ring-violet-500",
        error: "border-red-500 focus:ring-red-500",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

type InputProps = ComponentPropsWithoutRef<typeof BaseInput> &
  VariantProps<typeof inputVariants>;

export function Input({ state, className, ...props }: InputProps) {
  return (
    <BaseInput className={cn(inputVariants({ state }), className)} {...props} />
  );
}
