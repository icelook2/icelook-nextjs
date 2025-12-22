"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "@/lib/utils/cn";

interface SwitchProps {
 checked?: boolean;
 defaultChecked?: boolean;
 onCheckedChange?: (checked: boolean) => void;
 disabled?: boolean;
 name?: string;
 className?: string;
}

export function Switch({
 checked,
 defaultChecked,
 onCheckedChange,
 disabled,
 name,
 className,
}: SwitchProps) {
 return (
 <BaseSwitch.Root
 checked={checked}
 defaultChecked={defaultChecked}
 onCheckedChange={onCheckedChange}
 disabled={disabled}
 name={name}
 className={cn(
 "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
 "bg-border data-[state=checked]:bg-accent",
 "focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent",
 "disabled:cursor-not-allowed disabled:opacity-50",
 className,
 )}
 >
 <BaseSwitch.Thumb
 className={cn(
 "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200",
 "translate-x-0.5 data-[state=checked]:translate-x-[22px]",
 )}
 />
 </BaseSwitch.Root>
 );
}
