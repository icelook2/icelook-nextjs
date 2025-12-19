"use client";

import Image from "next/image";

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-xl",
};

const imageSizes = {
  sm: 32,
  md: 48,
  lg: 64,
};

// Consistent gradients based on name
const gradients = [
  "from-violet-500 to-purple-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-500",
];

export function Avatar({ url, name, size = "md" }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const gradientIndex = name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];
  const sizeClass = sizeClasses[size];
  const imageSize = imageSizes[size];

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={imageSize}
        height={imageSize}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-semibold text-white`}
    >
      {initial}
    </div>
  );
}
