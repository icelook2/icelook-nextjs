"use client";

import Image from "next/image";

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** Shape of the avatar. Use "circle" for users, "rounded" for beauty pages */
  shape?: "circle" | "rounded";
}

const sizeClasses = {
  xs: "h-5 w-5 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-xl",
};

const imageSizes = {
  xs: 20,
  sm: 32,
  md: 48,
  lg: 64,
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
  const initial = name.charAt(0).toUpperCase();
  const gradientIndex = name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];
  const sizeClass = sizeClasses[size];
  const imageSize = imageSizes[size];
  const shapeClass = shapeClasses[shape];

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={imageSize}
        height={imageSize}
        className={`${sizeClass} ${shapeClass} shrink-0 object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} ${shapeClass} shrink-0 items-center justify-center bg-gradient-to-br ${gradient} font-semibold text-white`}
    >
      {initial}
    </div>
  );
}
