"use client";

interface BasicsPreviewProps {
  name: string;
  nickname: string;
}

// Consistent gradients for logo fallback based on name (matching HeroSection)
const gradients = [
  "from-blue-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-indigo-500",
];

/**
 * Preview component for the Basics step.
 * Shows a simplified version of the HeroSection with the user's input.
 */
export function BasicsPreview({ name, nickname }: BasicsPreviewProps) {
  const displayName = name || "Your Beauty Page";
  const displayNickname = nickname || "your-nickname";

  const initial = displayName.charAt(0).toUpperCase();
  const gradientIndex = displayName.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <div className="space-y-3">
      {/* Avatar + Name row */}
      <div className="flex items-start gap-4">
        {/* Logo/Avatar placeholder with gradient */}
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-2xl font-bold text-white`}
        >
          {initial}
        </div>

        {/* Name, nickname */}
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="truncate text-lg font-semibold">{displayName}</h2>
          <p className="text-sm text-muted">@{displayNickname}</p>
        </div>
      </div>

      {/* Placeholder bio area */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-surface-hover" />
        <div className="h-3 w-3/4 rounded bg-surface-hover" />
      </div>
    </div>
  );
}
