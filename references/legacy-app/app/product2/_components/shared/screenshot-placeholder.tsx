import { ImageIcon } from "lucide-react";

type ScreenshotPlaceholderProps = {
  label: string;
  description: string;
  dimensions?: string;
  className?: string;
};

/**
 * Placeholder component for screenshots that will be added later.
 * Shows a descriptive overlay explaining what image should go there.
 */
export function ScreenshotPlaceholder({
  label,
  description,
  dimensions,
  className = "",
}: ScreenshotPlaceholderProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-surface-alt via-surface to-surface-alt p-6 text-center ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
        <ImageIcon className="h-6 w-6 text-accent" />
      </div>
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-2 max-w-xs text-sm text-muted">{description}</p>
      {dimensions && (
        <p className="mt-3 rounded-full bg-surface-alt px-3 py-1 text-xs text-muted">
          {dimensions}
        </p>
      )}
    </div>
  );
}
