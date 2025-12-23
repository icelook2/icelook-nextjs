import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Paper } from "./paper";

interface SettingsGroupProps {
 children: ReactNode;
 title?: ReactNode;
 description?: string;
 action?: ReactNode;
 className?: string;
}

export function SettingsGroup({
 children,
 title,
 description,
 action,
 className,
}: SettingsGroupProps) {
 return (
 <section className={cn("space-y-4", className)}>
 {(title || description || action) && (
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-1">
 {title && (
 <h2 className="text-base font-semibold">{title}</h2>
 )}
 {description && <p className="text-sm text-muted">{description}</p>}
 </div>
 {action && <div className="shrink-0">{action}</div>}
 </div>
 )}
 <Paper>{children}</Paper>
 </section>
 );
}

interface SettingsRowProps {
 children: ReactNode;
 className?: string;
 noBorder?: boolean;
}

export function SettingsRow({
 children,
 className,
 noBorder = false,
}: SettingsRowProps) {
 return (
 <div
 className={cn(
 "px-4 py-4",
 !noBorder && "border-b border-border last:border-b-0",
 className,
 )}
 >
 {children}
 </div>
 );
}

interface SettingsLabeledRowProps {
 label: string;
 description?: string;
 children: ReactNode;
 className?: string;
 noBorder?: boolean;
}

export function SettingsLabeledRow({
 label,
 description,
 children,
 className,
 noBorder = false,
}: SettingsLabeledRowProps) {
 return (
 <SettingsRow
 className={cn("flex items-center justify-between gap-4", className)}
 noBorder={noBorder}
 >
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium">{label}</p>
 {description && <p className="text-xs text-muted">{description}</p>}
 </div>
 <div className="shrink-0">{children}</div>
 </SettingsRow>
 );
}
