"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { motion } from "motion/react";
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
 return (
 <BasePopover.Trigger {...props}>
 {children}
 </BasePopover.Trigger>
 );
}

// ============================================================================
// Popover Portal
// ============================================================================

function PopoverPortal({ children }: { children: ReactNode }) {
 return <BasePopover.Portal>{children}</BasePopover.Portal>;
}

// ============================================================================
// Popover Content with Animation
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
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -4 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: -4 }}
 transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
 className={cn(
 "z-50 rounded-2xl border border-text/10 bg-surface p-2 shadow-lg",
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
