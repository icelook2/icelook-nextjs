import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-foreground/80",
        className,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white">
        <span className="text-sm font-bold">IL</span>
      </div>
      {!collapsed && <span className="text-lg">Icelook</span>}
    </Link>
  );
}
