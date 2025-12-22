"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const textareaVariants = cva(
  "w-full px-4 py-3 rounded-2xl border border-border bg-background transition-colors duration-150 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed resize-none",
  {
    variants: {
      state: {
        default: "focus:ring-accent",
        error: "border-danger focus:ring-danger",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  VariantProps<typeof textareaVariants>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ state, className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(textareaVariants({ state }), className)}
        {...props}
      />
    );
  },
);
