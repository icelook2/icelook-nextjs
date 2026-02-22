"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Context Menu Root
// ============================================================================

type ContextMenuRootProps = ComponentPropsWithoutRef<
  typeof BaseContextMenu.Root
>;

function ContextMenuRoot({ children, ...props }: ContextMenuRootProps) {
  return <BaseContextMenu.Root {...props}>{children}</BaseContextMenu.Root>;
}

// ============================================================================
// Context Menu Trigger
// ============================================================================

type ContextMenuTriggerProps = ComponentPropsWithoutRef<
  typeof BaseContextMenu.Trigger
>;

function ContextMenuTrigger({
  children,
  className,
  ...props
}: ContextMenuTriggerProps) {
  return (
    <BaseContextMenu.Trigger className={className} {...props}>
      {children}
    </BaseContextMenu.Trigger>
  );
}

// ============================================================================
// Context Menu Portal
// ============================================================================

function ContextMenuPortal({ children }: { children: ReactNode }) {
  return <BaseContextMenu.Portal>{children}</BaseContextMenu.Portal>;
}

// ============================================================================
// Context Menu Content (Positioner + Popup)
// ============================================================================

interface ContextMenuContentProps {
  children: ReactNode;
  className?: string;
  sideOffset?: number;
}

function ContextMenuContent({
  children,
  className,
  sideOffset = 4,
}: ContextMenuContentProps) {
  return (
    <BaseContextMenu.Positioner sideOffset={sideOffset}>
      <BaseContextMenu.Popup
        render={
          <div
            className={cn(
              "min-w-[180px] rounded-xl border border-text/10 bg-surface p-1 shadow-lg",
              "focus:outline-none",
              className,
            )}
          />
        }
      >
        {children}
      </BaseContextMenu.Popup>
    </BaseContextMenu.Positioner>
  );
}

// ============================================================================
// Context Menu Item
// ============================================================================

interface ContextMenuItemProps
  extends Omit<
    ComponentPropsWithoutRef<typeof BaseContextMenu.Item>,
    "className"
  > {
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "danger";
  className?: string;
}

function ContextMenuItem({
  children,
  icon: Icon,
  variant = "default",
  className,
  ...props
}: ContextMenuItemProps) {
  return (
    <BaseContextMenu.Item
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
    </BaseContextMenu.Item>
  );
}

// ============================================================================
// Context Menu Separator
// ============================================================================

function ContextMenuSeparator({ className }: { className?: string }) {
  return (
    <BaseContextMenu.Separator
      className={cn("my-1 h-px bg-text/10", className)}
    />
  );
}

// ============================================================================
// Context Menu Group & Group Label
// ============================================================================

type ContextMenuGroupProps = ComponentPropsWithoutRef<
  typeof BaseContextMenu.Group
>;

function ContextMenuGroup({ children, ...props }: ContextMenuGroupProps) {
  return <BaseContextMenu.Group {...props}>{children}</BaseContextMenu.Group>;
}

interface ContextMenuGroupLabelProps {
  children: ReactNode;
  className?: string;
}

function ContextMenuGroupLabel({
  children,
  className,
}: ContextMenuGroupLabelProps) {
  return (
    <BaseContextMenu.GroupLabel
      className={cn("px-3 py-1.5 text-xs font-medium text-muted", className)}
    >
      {children}
    </BaseContextMenu.GroupLabel>
  );
}

// ============================================================================
// Export
// ============================================================================

export const ContextMenu = {
  Root: ContextMenuRoot,
  Trigger: ContextMenuTrigger,
  Portal: ContextMenuPortal,
  Content: ContextMenuContent,
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Group: ContextMenuGroup,
  GroupLabel: ContextMenuGroupLabel,
};
