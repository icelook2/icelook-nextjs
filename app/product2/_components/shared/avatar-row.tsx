import { User } from "lucide-react";

type AvatarRowProps = {
  /**
   * Array of avatar data. Each item can be:
   * - A string URL to an image
   * - An object with initials and optional color
   */
  avatars?: Array<
    | string
    | { initials: string; color?: string }
  >;
  /** Number to show as "more" count (e.g., +495) */
  moreCount?: number;
  /** Size of each avatar */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const gradients = [
  "from-violet-400 to-purple-500",
  "from-pink-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-green-500",
  "from-sky-400 to-blue-500",
];

/**
 * Row of overlapping avatars for social proof.
 * Shows placeholder avatars with initials/icons until real photos are added.
 */
export function AvatarRow({
  avatars,
  moreCount = 495,
  size = "md",
  className = "",
}: AvatarRowProps) {
  // Default placeholder avatars
  const defaultAvatars: Array<{ initials: string; color: string }> = [
    { initials: "AM", color: gradients[0] },
    { initials: "OK", color: gradients[1] },
    { initials: "ML", color: gradients[2] },
    { initials: "SV", color: gradients[3] },
    { initials: "NP", color: gradients[4] },
  ];

  const displayAvatars = avatars ?? defaultAvatars;
  const sizeClass = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-3">
        {displayAvatars.map((avatar, index) => {
          if (typeof avatar === "string") {
            // URL image
            return (
              <div
                key={index}
                className={`${sizeClass} overflow-hidden rounded-full border-2 border-background`}
              >
                <img
                  src={avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            );
          }

          // Initials avatar
          const gradient = avatar.color ?? gradients[index % gradients.length];
          return (
            <div
              key={index}
              className={`${sizeClass} flex items-center justify-center rounded-full border-2 border-background bg-gradient-to-br font-medium text-white ${gradient}`}
            >
              {avatar.initials || <User className="h-4 w-4" />}
            </div>
          );
        })}

        {/* More count */}
        {moreCount > 0 && (
          <div
            className={`${sizeClass} flex items-center justify-center rounded-full border-2 border-background bg-surface-alt font-medium text-muted`}
          >
            +{moreCount}
          </div>
        )}
      </div>
    </div>
  );
}
