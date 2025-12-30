"use client";

/**
 * Tabs Component
 *
 * Wrapper around Base UI Tabs for toggling between related panels.
 * Supports both horizontal and vertical orientations.
 */

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Root
// ============================================================================

type TabsRootProps = ComponentPropsWithoutRef<typeof BaseTabs.Root>;

function TabsRoot({ className, ...props }: TabsRootProps) {
  return <BaseTabs.Root className={cn(className)} {...props} />;
}

// ============================================================================
// List
// ============================================================================

type TabsListProps = ComponentPropsWithoutRef<typeof BaseTabs.List>;

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <BaseTabs.List
      className={cn(
        "flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800",
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Tab
// ============================================================================

type TabsTabProps = ComponentPropsWithoutRef<typeof BaseTabs.Tab>;

function TabsTab({ className, ...props }: TabsTabProps) {
  return (
    <BaseTabs.Tab
      className={cn(
        "flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "text-neutral-600 dark:text-neutral-400",
        "hover:text-neutral-900 dark:hover:text-neutral-100",
        "data-[active]:bg-white data-[active]:text-neutral-900 data-[active]:shadow-sm",
        "dark:data-[active]:bg-neutral-700 dark:data-[active]:text-neutral-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
        "dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Panel
// ============================================================================

type TabsPanelProps = ComponentPropsWithoutRef<typeof BaseTabs.Panel>;

function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      className={cn(
        "mt-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2",
        "dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950",
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Indicator
// ============================================================================

type TabsIndicatorProps = ComponentPropsWithoutRef<typeof BaseTabs.Indicator>;

function TabsIndicator({ className, ...props }: TabsIndicatorProps) {
  return (
    <BaseTabs.Indicator
      className={cn(
        "absolute h-full rounded-md bg-white shadow-sm transition-all duration-200",
        "dark:bg-neutral-700",
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Export
// ============================================================================

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
  Indicator: TabsIndicator,
};

// Export individual components for direct imports
export { TabsRoot, TabsList, TabsTab, TabsPanel, TabsIndicator };
