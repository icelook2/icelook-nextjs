"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { motion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Menu Root
// ============================================================================

type MenuRootProps = ComponentPropsWithoutRef<typeof BaseMenu.Root>;

function MenuRoot({ children, ...props }: MenuRootProps) {
  return <BaseMenu.Root {...props}>{children}</BaseMenu.Root>;
}

// ============================================================================
// Menu Trigger
// ============================================================================

type MenuTriggerProps = ComponentPropsWithoutRef<typeof BaseMenu.Trigger>;

function MenuTrigger({ children, className, ...props }: MenuTriggerProps) {
  return (
    <BaseMenu.Trigger
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-2 text-muted transition-colors",
        "hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "data-[popup-open]:bg-black/5 dark:data-[popup-open]:bg-white/5",
        className,
      )}
      {...props}
    >
      {children}
    </BaseMenu.Trigger>
  );
}

// ============================================================================
// Menu Portal
// ============================================================================

function MenuPortal({ children }: { children: ReactNode }) {
  return <BaseMenu.Portal>{children}</BaseMenu.Portal>;
}

// ============================================================================
// Menu Content (Positioner + Popup with Animation)
// ============================================================================

interface MenuContentProps {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}

function MenuContent({
  children,
  className,
  align = "end",
  side = "bottom",
  sideOffset = 4,
}: MenuContentProps) {
  return (
    <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset}>
      <BaseMenu.Popup
        render={
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "min-w-[180px] rounded-xl border border-text/10 bg-surface p-1 shadow-lg",
              "focus:outline-none",
              className,
            )}
          />
        }
      >
        {children}
      </BaseMenu.Popup>
    </BaseMenu.Positioner>
  );
}

// ============================================================================
// Menu Item
// ============================================================================

interface MenuItemProps
  extends Omit<ComponentPropsWithoutRef<typeof BaseMenu.Item>, "className"> {
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "danger";
  className?: string;
}

function MenuItem({
  children,
  icon: Icon,
  variant = "default",
  className,
  ...props
}: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none",
        "data-[highlighted]:bg-accent data-[highlighted]:text-white",
        variant === "danger" &&
          "text-danger data-[highlighted]:bg-danger data-[highlighted]:text-white",
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </BaseMenu.Item>
  );
}

// ============================================================================
// Menu Separator
// ============================================================================

function MenuSeparator({ className }: { className?: string }) {
  return (
    <BaseMenu.Separator className={cn("my-1 h-px bg-text/10", className)} />
  );
}

// ============================================================================
// Menu Group & Group Label
// ============================================================================

type MenuGroupProps = ComponentPropsWithoutRef<typeof BaseMenu.Group>;

function MenuGroup({ children, ...props }: MenuGroupProps) {
  return <BaseMenu.Group {...props}>{children}</BaseMenu.Group>;
}

interface MenuGroupLabelProps {
  children: ReactNode;
  className?: string;
}

function MenuGroupLabel({ children, className }: MenuGroupLabelProps) {
  return (
    <BaseMenu.GroupLabel
      className={cn("px-3 py-1.5 text-xs font-medium text-muted", className)}
    >
      {children}
    </BaseMenu.GroupLabel>
  );
}

// ============================================================================
// Export
// ============================================================================

export const Menu = {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Portal: MenuPortal,
  Content: MenuContent,
  Item: MenuItem,
  Separator: MenuSeparator,
  Group: MenuGroup,
  GroupLabel: MenuGroupLabel,
};
