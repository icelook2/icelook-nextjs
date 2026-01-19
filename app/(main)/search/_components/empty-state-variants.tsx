import { Users } from "lucide-react";

interface EmptyStateVariantsProps {
  message: string;
}

export function EmptyStateVariants({ message }: EmptyStateVariantsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Users className="h-12 w-12 text-muted/30" />
      <p className="text-center text-sm text-muted">{message}</p>
    </div>
  );
}
