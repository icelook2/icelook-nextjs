import { cn } from "@/lib/utils/cn";

interface IcelookLogoProps {
  /** Height in pixels. Width scales proportionally (aspect ratio ~0.64) */
  size?: number;
  className?: string;
}

export function IcelookLogo({ size = 32, className }: IcelookLogoProps) {
  // Original viewBox: 390x609, aspect ratio: 390/609 ≈ 0.64
  const width = Math.round(size * 0.64);

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 390 609"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Icelook"
    >
      <ellipse
        cx="74.0996"
        cy="78.0768"
        rx="74.0996"
        ry="70.2692"
        fill="#A1FF06"
      />
      <rect
        y="210.808"
        width="148.199"
        height="398.192"
        rx="74.0996"
        fill="#FE4090"
      />
      <rect
        x="241.801"
        width="148.199"
        height="609"
        rx="74.0996"
        fill="#B358FB"
      />
    </svg>
  );
}
