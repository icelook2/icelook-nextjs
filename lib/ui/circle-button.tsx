"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const circleButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-150 cursor-pointer focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        ghost:
          "bg-transparent text-muted hover:bg-surface-hover hover:text-foreground",
        soft: "bg-surface text-foreground hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent",
        primary:
          "bg-accent text-white hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent",
      },
      size: {
        // 44px - Apple's recommended minimum tap target
        default: "h-11 w-11",
        // 40px - slightly smaller for tight spaces
        sm: "h-10 w-10",
        // 48px - larger for prominent actions
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "default",
    },
  },
);

export { circleButtonVariants };

type CircleButtonProps = ComponentPropsWithoutRef<typeof BaseButton> &
  VariantProps<typeof circleButtonVariants> & {
    loading?: boolean;
    children: ReactNode;
  };

export function CircleButton({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  render,
  ...props
}: CircleButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <BaseButton
      disabled={isDisabled}
      focusableWhenDisabled={loading}
      className={cn(circleButtonVariants({ variant, size }), className)}
      render={render}
      nativeButton={!render}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        children
      )}
    </BaseButton>
  );
}
