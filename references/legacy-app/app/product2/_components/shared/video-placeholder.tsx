import { Play, Video } from "lucide-react";

type VideoPlaceholderProps = {
  label: string;
  steps?: string[];
  duration?: string;
  className?: string;
};

/**
 * Placeholder component for video content that will be added later.
 * Shows a video player mockup with description of expected content.
 */
export function VideoPlaceholder({
  label,
  steps,
  duration = "15-30 seconds",
  className = "",
}: VideoPlaceholderProps) {
  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/10 via-pink-500/10 to-orange-500/10 ${className}`}
    >
      {/* Content description */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Video className="h-7 w-7 text-accent" />
        </div>
        <p className="font-semibold text-foreground">{label}</p>

        {steps && steps.length > 0 && (
          <ol className="mt-4 space-y-1 text-left text-sm text-muted">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-4 text-xs text-muted">Duration: {duration}, looping</p>
      </div>

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 transition-colors hover:bg-foreground/10">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform hover:scale-110 dark:bg-surface">
          <Play className="ml-1 h-8 w-8 fill-accent text-accent" />
        </div>
      </div>
    </div>
  );
}
