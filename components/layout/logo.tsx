import Link from "next/link";
import { IcelookLogo } from "@/components/icelook-logo";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl transition-all hover:scale-105",
        className,
      )}
      aria-label="Go to home"
    >
      <IcelookLogo size={36} />
    </Link>
  );
}
