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
 "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors bg-transparent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
 className,
 )}
 >
 <BaseCheckbox.Indicator>
 <Check className="h-3.5 w-3.5" strokeWidth={3} />
 </BaseCheckbox.Indicator>
 </BaseCheckbox.Root>
 );
}
