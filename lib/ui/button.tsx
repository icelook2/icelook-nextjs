"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "./button-variants";

// Re-export for backwards compatibility
export { buttonVariants } from "./button-variants";

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
      nativeButton={!render}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </BaseButton>
  );
}
