interface SummaryRowProps {
  label: string;
  children: React.ReactNode;
}

/**
 * Summary row for booking confirmation
 *
 * Displays a label (Who, When, Where, What, Price) with its value.
 */
export function SummaryRow({ label, children }: SummaryRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-24 shrink-0 pt-1 text-xs uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
