"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

export const inputVariants = cva(
  "w-full px-4 py-3 rounded-full border bg-white text-gray-900 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
  {
    variants: {
      state: {
        default: "border-gray-200 focus:ring-violet-500",
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
