import type { ReactNode } from "react";

type DeviceFrameProps = {
  type: "phone" | "laptop";
  children: ReactNode;
  className?: string;
};

/**
 * Device frame wrapper that displays content inside a phone or laptop mockup.
 * Used to showcase screenshots in a realistic device context.
 */
export function DeviceFrame({
  type,
  children,
  className = "",
}: DeviceFrameProps) {
  if (type === "phone") {
    return (
      <div className={`relative mx-auto max-w-[280px] ${className}`}>
        {/* Phone frame */}
        <div className="rounded-[2.5rem] border-4 border-foreground/10 bg-foreground/5 p-2 shadow-xl dark:border-foreground/20">
          {/* Dynamic island / notch */}
          <div className="absolute left-1/2 top-4 h-6 w-20 -translate-x-1/2 rounded-full bg-foreground/10 dark:bg-foreground/20" />
          {/* Screen */}
          <div className="overflow-hidden rounded-[2rem] bg-surface">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Laptop frame
  return (
    <div className={`relative ${className}`}>
      {/* Screen */}
      <div className="rounded-t-xl border-4 border-b-0 border-foreground/10 bg-foreground/5 p-2 dark:border-foreground/20">
        {/* Camera */}
        <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-foreground/10 dark:bg-foreground/20" />
        {/* Screen content */}
        <div className="mt-2 overflow-hidden rounded-t-lg bg-surface">
          {children}
        </div>
      </div>
      {/* Keyboard base */}
      <div className="h-3 rounded-b-lg bg-foreground/10 dark:bg-foreground/20" />
      {/* Hinge */}
      <div className="mx-auto h-1 w-1/3 rounded-b bg-foreground/5 dark:bg-foreground/10" />
    </div>
  );
}
