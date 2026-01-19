"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, X } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Select Root
// ============================================================================

type SelectItem = {
  value: string | number | null;
  label: string;
};

type SelectRootProps = Omit<
  ComponentPropsWithoutRef<typeof BaseSelect.Root>,
  "items"
> & {
  items?: SelectItem[];
};

function SelectRoot({ children, value, items, ...props }: SelectRootProps) {
  // Convert undefined to null to maintain controlled mode consistently
  // undefined = uncontrolled, null = controlled with no selection
  const controlledValue = value === undefined ? null : value;

  return (
    <BaseSelect.Root value={controlledValue} items={items} {...props}>
      {children}
    </BaseSelect.Root>
  );
}

// ============================================================================
// Select Trigger Wrapper (matches Combobox InputWrapper)
// ============================================================================

type SelectTriggerWrapperProps = {
  children: ReactNode;
  className?: string;
};

function SelectTriggerWrapper({
  children,
  className,
}: SelectTriggerWrapperProps) {
  return (
    <div
      className={cn(
        "relative [&>button]:pr-[calc(0.5rem+1.5rem)] has-[.select-clear]:[&>button]:pr-[calc(0.5rem+1.5rem*2)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Select Trigger (matches Combobox Input styling)
// ============================================================================

type SelectTriggerProps = ComponentPropsWithoutRef<
  typeof BaseSelect.Trigger
> & {
  placeholder?: string;
  state?: "default" | "error";
  /**
   * Items array for label lookup. When provided, the trigger will display
   * the label of the selected item instead of the raw value.
   */
  items?: SelectItem[];
};

function SelectTrigger({
  state = "default",
  placeholder,
  items,
  className,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      className={cn(
        "w-full py-3 rounded-2xl font-normal border border-border px-4 text-base text-foreground bg-background text-left flex items-center justify-between gap-2",
        "focus:outline focus:outline-2 focus:-outline-offset-1",
        state === "error" ? "focus:outline-danger" : "focus:outline-accent",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <BaseSelect.Value className="flex-1 truncate data-[placeholder]:text-muted">
            {(value) => {
              if (value === null || value === undefined || value === "") {
                return placeholder;
              }
              // Look up the label from items if provided
              if (items) {
                const item = items.find((i) => i.value === value);
                return item?.label ?? value;
              }
              return value;
            }}
          </BaseSelect.Value>
          <BaseSelect.Icon className="text-muted shrink-0">
            <ChevronDown className="size-4" />
          </BaseSelect.Icon>
        </>
      )}
    </BaseSelect.Trigger>
  );
}

// ============================================================================
// Select Actions (container for clear + icon)
// ============================================================================

type SelectActionsProps = {
  children: ReactNode;
  className?: string;
};

function SelectActions({ children, className }: SelectActionsProps) {
  return (
    <div
      className={cn(
        "absolute h-full right-2 bottom-0 flex items-center justify-center text-muted pointer-events-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Select Clear
// ============================================================================

type SelectClearProps = {
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
};

function SelectClear({ onClick, className, children }: SelectClearProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "select-clear flex w-6 items-center justify-center rounded bg-transparent p-0 pointer-events-auto",
        className,
      )}
      aria-label="Clear selection"
    >
      {children ?? <X className="size-4" />}
    </button>
  );
}

// ============================================================================
// Select Icon (chevron)
// ============================================================================

type SelectIconProps = {
  className?: string;
  children?: ReactNode;
};

function SelectIcon({ className, children }: SelectIconProps) {
  return (
    <BaseSelect.Icon
      className={cn("flex w-6 items-center justify-center", className)}
    >
      {children ?? <ChevronDown className="size-4" />}
    </BaseSelect.Icon>
  );
}

// ============================================================================
// Select Content (Portal + Positioner + Popup combined)
// ============================================================================

type SelectContentProps = ComponentPropsWithoutRef<typeof BaseSelect.Popup> & {
  children: ReactNode;
  sideOffset?: number;
};

function SelectContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: SelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        className="outline-none"
        sideOffset={sideOffset}
        align="start"
        alignItemWithTrigger={false}
      >
        <BaseSelect.Popup
          className={cn(
            "w-[var(--anchor-width)] max-h-[23rem] max-w-[var(--available-width)] origin-[var(--transform-origin)] rounded-2xl bg-background text-foreground shadow-lg outline outline-1 outline-border transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 dark:shadow-none duration-100",
            className,
          )}
          {...props}
        >
          <BaseSelect.List className="outline-0 overflow-y-auto scroll-py-[0.5rem] py-2 overscroll-contain max-h-[min(23rem,var(--available-height))]">
            {children}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

// ============================================================================
// Select Item (matches Combobox Item styling)
// ============================================================================

type SelectItemProps = ComponentPropsWithoutRef<typeof BaseSelect.Item> & {
  children: ReactNode;
};

function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item
      className={cn(
        "grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-accent data-[disabled]:text-muted data-[disabled]:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemIndicator className="col-start-1">
        <Check className="size-3" />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className="col-start-2">
        {children}
      </BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

// ============================================================================
// Export
// ============================================================================

export type { SelectItem };

export const Select = {
  Root: SelectRoot,
  TriggerWrapper: SelectTriggerWrapper,
  Trigger: SelectTrigger,
  Actions: SelectActions,
  Clear: SelectClear,
  Icon: SelectIcon,
  Content: SelectContent,
  Item: SelectItem,
};
