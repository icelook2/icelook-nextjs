"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  className?: string;
}

export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  name,
  className,
}: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
        "border-foreground/30 bg-transparent",
        "data-[checked]:border-violet-500 data-[checked]:bg-violet-500",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <BaseCheckbox.Indicator className="text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
