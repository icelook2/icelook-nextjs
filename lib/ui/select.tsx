"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, Check } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const selectTriggerVariants = cva(
  "inline-flex items-center justify-between gap-2 w-full px-4 py-3 rounded-full border bg-background text-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-foreground/5 disabled:text-foreground/40 disabled:cursor-not-allowed cursor-pointer",
  {
    variants: {
      state: {
        default: "border-foreground/20 focus:ring-violet-500",
        error: "border-red-500 focus:ring-red-500",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

const selectPopupVariants = cva(
  "bg-background border border-foreground/20 rounded-2xl shadow-lg py-1 max-h-60 overflow-auto focus:outline-none min-w-[var(--anchor-width)]",
);

const selectItemVariants = cva(
  "flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors duration-150 data-[highlighted]:bg-foreground/10 data-[selected]:text-violet-500 data-[disabled]:text-foreground/40 data-[disabled]:cursor-not-allowed",
);

// Root
type SelectRootProps = ComponentPropsWithoutRef<typeof BaseSelect.Root>;

function SelectRoot({ children, value, ...props }: SelectRootProps) {
  // Convert undefined to null to maintain controlled mode consistently
  // undefined = uncontrolled, null = controlled with no selection
  const controlledValue = value === undefined ? null : value;

  return (
    <BaseSelect.Root value={controlledValue} {...props}>
      {children}
    </BaseSelect.Root>
  );
}

// Trigger
type SelectTriggerProps = ComponentPropsWithoutRef<typeof BaseSelect.Trigger> &
  VariantProps<typeof selectTriggerVariants> & {
    placeholder?: string;
  };

function SelectTrigger({
  state,
  placeholder,
  className,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      className={cn(selectTriggerVariants({ state }), className)}
      {...props}
    >
      {children ?? (
        <>
          <BaseSelect.Value className="text-left flex-1 data-[placeholder]:text-foreground/40">
            {(value) => (value ? String(value) : placeholder)}
          </BaseSelect.Value>
          <BaseSelect.Icon className="text-foreground/40">
            <ChevronDown className="h-4 w-4" />
          </BaseSelect.Icon>
        </>
      )}
    </BaseSelect.Trigger>
  );
}

// Portal + Positioner + Popup combined for simpler API
type SelectContentProps = ComponentPropsWithoutRef<typeof BaseSelect.Popup> & {
  children: ReactNode;
};

function SelectContent({ className, children, ...props }: SelectContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={4} align="start">
        <BaseSelect.Popup
          className={cn(selectPopupVariants(), className)}
          {...props}
        >
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

// Item
type SelectItemProps = ComponentPropsWithoutRef<typeof BaseSelect.Item> & {
  children: ReactNode;
};

function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <BaseSelect.Item className={cn(selectItemVariants(), className)} {...props}>
      <BaseSelect.ItemIndicator className="w-4">
        <Check className="h-4 w-4" />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

export const Select = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: SelectItem,
};
