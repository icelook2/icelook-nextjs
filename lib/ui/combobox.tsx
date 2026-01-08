"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Combobox Input Wrapper
// ============================================================================

type ComboboxInputWrapperProps = {
  children: ReactNode;
  className?: string;
};

function ComboboxInputWrapper({
  children,
  className,
}: ComboboxInputWrapperProps) {
  return (
    <div
      className={cn(
        "relative [&>input]:pr-[calc(0.5rem+1.5rem)] has-[.combobox-clear]:[&>input]:pr-[calc(0.5rem+1.5rem*2)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Combobox Input
// ============================================================================

type ComboboxInputProps = ComponentPropsWithoutRef<typeof BaseCombobox.Input>;

function ComboboxInput({ className, ...props }: ComboboxInputProps) {
  return (
    <BaseCombobox.Input
      className={cn(
        "w-full py-3 rounded-2xl font-normal border border-border px-4 text-base text-foreground bg-background focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-accent",
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Combobox Actions (container for clear + trigger)
// ============================================================================

type ComboboxActionsProps = {
  children: ReactNode;
  className?: string;
};

function ComboboxActions({ children, className }: ComboboxActionsProps) {
  return (
    <div
      className={cn(
        "absolute h-full right-2 bottom-0 flex items-center justify-center text-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Combobox Clear
// ============================================================================

type ComboboxClearProps = ComponentPropsWithoutRef<typeof BaseCombobox.Clear>;

/**
 * Clear button for the combobox.
 *
 * Note: Base UI's Clear conditionally renders based on whether there's a value.
 * This can cause hydration mismatches if the value differs between server and
 * client. For required fields where clearing isn't needed (like timezone),
 * simply don't include this component.
 */
function ComboboxClear({ className, children, ...props }: ComboboxClearProps) {
  return (
    <BaseCombobox.Clear
      className={cn(
        "combobox-clear flex w-6 items-center justify-center rounded bg-transparent p-0",
        className,
      )}
      aria-label="Clear selection"
      {...props}
    >
      {children ?? <X className="size-4" />}
    </BaseCombobox.Clear>
  );
}

// ============================================================================
// Combobox Trigger (chevron button)
// ============================================================================

type ComboboxTriggerProps = ComponentPropsWithoutRef<
  typeof BaseCombobox.Trigger
>;

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxTriggerProps) {
  return (
    <BaseCombobox.Trigger
      className={cn(
        "flex w-6 items-center justify-center rounded bg-transparent p-0",
        className,
      )}
      aria-label="Open popup"
      {...props}
    >
      {children ?? <ChevronDown className="size-4" />}
    </BaseCombobox.Trigger>
  );
}

// ============================================================================
// Combobox Content (Portal + Positioner + Popup combined)
// ============================================================================

type ComboboxContentProps = {
  children: ReactNode;
  className?: string;
  sideOffset?: number;
};

function ComboboxContent({
  children,
  className,
  sideOffset = 4,
}: ComboboxContentProps) {
  return (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner className="outline-none" sideOffset={sideOffset}>
        <BaseCombobox.Popup
          className={cn(
            "w-[var(--anchor-width)] max-h-[23rem] max-w-[var(--available-width)] origin-[var(--transform-origin)] rounded-2xl bg-background text-foreground shadow-lg outline outline-1 outline-border transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 dark:shadow-none duration-100",
            className,
          )}
        >
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  );
}

// ============================================================================
// Combobox Empty
// ============================================================================

type ComboboxEmptyProps = ComponentPropsWithoutRef<typeof BaseCombobox.Empty>;

function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return (
    <BaseCombobox.Empty
      className={cn(
        "p-4 text-[0.925rem] leading-4 text-muted empty:m-0 empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Combobox List
// ============================================================================

type ComboboxListProps<T> = {
  children: ((item: T) => ReactNode) | ReactNode;
  className?: string;
};

function ComboboxList<T>({ className, children }: ComboboxListProps<T>) {
  return (
    <BaseCombobox.List
      className={cn(
        "outline-0 overflow-y-auto scroll-py-[0.5rem] py-2 overscroll-contain max-h-[min(23rem,var(--available-height))] data-[empty]:p-0",
        className,
      )}
    >
      {children}
    </BaseCombobox.List>
  );
}

// ============================================================================
// Combobox Item
// ============================================================================

type ComboboxItemProps<T> = {
  value: T;
  label?: string;
  children?: ReactNode;
  className?: string;
};

function ComboboxItem<T>({ className, ...props }: ComboboxItemProps<T>) {
  return (
    <BaseCombobox.Item
      className={cn(
        "grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-white data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-2 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-accent",
        className,
      )}
      {...props}
    />
  );
}

// ============================================================================
// Combobox Item Indicator
// ============================================================================

type ComboboxItemIndicatorProps = ComponentPropsWithoutRef<
  typeof BaseCombobox.ItemIndicator
>;

function ComboboxItemIndicator({
  className,
  children,
  ...props
}: ComboboxItemIndicatorProps) {
  return (
    <BaseCombobox.ItemIndicator
      className={cn("col-start-1", className)}
      {...props}
    >
      {children ?? <Check className="size-3" />}
    </BaseCombobox.ItemIndicator>
  );
}

// ============================================================================
// Combobox Item Text
// ============================================================================

type ComboboxItemTextProps = {
  children: ReactNode;
  className?: string;
};

function ComboboxItemText({ children, className }: ComboboxItemTextProps) {
  return <div className={cn("col-start-2", className)}>{children}</div>;
}

// ============================================================================
// Export
// ============================================================================

export const Combobox = {
  Root: BaseCombobox.Root,
  InputWrapper: ComboboxInputWrapper,
  Input: ComboboxInput,
  Actions: ComboboxActions,
  Clear: ComboboxClear,
  Trigger: ComboboxTrigger,
  Content: ComboboxContent,
  Empty: ComboboxEmpty,
  List: ComboboxList,
  Item: ComboboxItem,
  ItemIndicator: ComboboxItemIndicator,
  ItemText: ComboboxItemText,
};
