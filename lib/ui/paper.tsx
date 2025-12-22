import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PaperProps {
 children: ReactNode;
 className?: string;
}

export function Paper({ children, className }: PaperProps) {
 return (
 <div
 className={cn(
 "rounded-2xl bg-surface border border-border",
 "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
 "dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
 className
 )}
 >
 {children}
 </div>
 );
}
