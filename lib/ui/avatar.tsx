"use client";

import Image from "next/image";
import { useState } from "react";
import { getStorageUrl } from "@/lib/storage/get-storage-url";

interface AvatarProps {
  /** Storage path or full URL (handles both for backwards compatibility) */
  url?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Shape of the avatar. Use "circle" for users, "rounded" for beauty pages */
  shape?: "circle" | "rounded";
}

const sizeClasses = {
  xs: "h-5 w-5 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-xl",
  xl: "h-20 w-20 text-3xl",
};

const imageSizes = {
  xs: 20,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
};

const shapeClasses = {
  circle: "rounded-full",
  rounded: "rounded-xl",
};

// Consistent gradients based on name
const gradients: string[] = [
  "from-blue-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-indigo-500",
];

export function Avatar({
  url,
  name,
  size = "md",
  shape = "circle",
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const initial = name.charAt(0).toUpperCase();
  const gradientIndex = name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];
  const sizeClass = sizeClasses[size];
  const imageSize = imageSizes[size];
  const shapeClass = shapeClasses[shape];

  // Show initials fallback if no URL or image failed to load
  if (!url || hasError) {
    return (
      <div
        className={`flex ${sizeClass} ${shapeClass} shrink-0 items-center justify-center bg-gradient-to-br ${gradient} font-semibold text-white`}
      >
        {initial}
      </div>
    );
  }

  // Construct full URL from storage path
  const resolvedUrl = getStorageUrl(url);

  return (
    <Image
      src={resolvedUrl}
      alt={name}
      width={imageSize}
      height={imageSize}
      className={`${sizeClass} ${shapeClass} shrink-0 object-cover`}
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
