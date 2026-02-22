"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Popover Root
// ============================================================================

type PopoverRootProps = ComponentPropsWithoutRef<typeof BasePopover.Root>;

function PopoverRoot({ children, ...props }: PopoverRootProps) {
  return <BasePopover.Root {...props}>{children}</BasePopover.Root>;
}

// ============================================================================
// Popover Trigger
// ============================================================================

type PopoverTriggerProps = ComponentPropsWithoutRef<typeof BasePopover.Trigger>;

function PopoverTrigger({ children, ...props }: PopoverTriggerProps) {
  return <BasePopover.Trigger {...props}>{children}</BasePopover.Trigger>;
}

// ============================================================================
// Popover Portal
// ============================================================================

function PopoverPortal({ children }: { children: ReactNode }) {
  return <BasePopover.Portal>{children}</BasePopover.Portal>;
}

// ============================================================================
// Popover Content
// ============================================================================

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

function PopoverContent({
  children,
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
}: PopoverContentProps) {
  return (
    <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset}>
      <BasePopover.Popup
        render={
          <div
            className={cn(
              "rounded-2xl border border-text/10 bg-surface p-2 shadow-lg",
              "focus:outline-none",
              className,
            )}
          />
        }
      >
        {children}
      </BasePopover.Popup>
    </BasePopover.Positioner>
  );
}

// ============================================================================
// Export
// ============================================================================

export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Portal: PopoverPortal,
  Content: PopoverContent,
};
