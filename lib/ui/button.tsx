"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 font-medium text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-violet-500 text-white hover:bg-violet-600 active:bg-violet-700 disabled:bg-foreground/10 disabled:text-foreground/40 rounded-full",
        secondary:
          "bg-foreground/10 text-foreground hover:bg-foreground/15 active:bg-foreground/20 disabled:bg-foreground/5 disabled:text-foreground/40 rounded-full",
        ghost:
          "bg-transparent text-foreground/70 hover:bg-foreground/10 active:bg-foreground/15 disabled:text-foreground/40 disabled:hover:bg-transparent rounded-full",
        danger:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-foreground/10 disabled:text-foreground/40 rounded-full",
        link: "bg-transparent text-foreground/50 hover:text-foreground/80 disabled:text-foreground/40 p-0",
        "link-primary":
          "bg-transparent text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 disabled:text-foreground/40 p-0",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-4 text-base",
      },
    },
    compoundVariants: [
      {
        variant: ["link", "link-primary"],
        className: "px-0 py-0",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = ComponentPropsWithoutRef<typeof BaseButton> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    children: ReactNode;
  };

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  render,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <BaseButton
      disabled={isDisabled}
      focusableWhenDisabled={loading}
      className={cn(buttonVariants({ variant, size }), className)}
      render={render}
      nativeButton={render === undefined}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </BaseButton>
  );
}
