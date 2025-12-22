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
const gradients: string[] = [
 "from-blue-400 to-cyan-500",
 "from-red-400 to-pink-500",
 "from-green-400 to-emerald-500",
 "from-yellow-400 to-orange-500",
 "from-purple-400 to-indigo-500",
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
 className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-semibold`}
 >
 {initial}
 </div>
 );
}
