import { Settings, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BeautyPageInfo } from "@/lib/queries/beauty-page-profile";
import { CircleButton } from "@/lib/ui/circle-button";
import { VerifiedBadge } from "./verified-badge";

interface RatingStats {
  averageRating: number;
  totalReviews: number;
}

interface HeroSectionProps {
  info: BeautyPageInfo;
  ratingStats?: RatingStats;
  /** Whether current user is the owner of this beauty page */
  isOwner?: boolean;
  translations: {
    verified: {
      title: string;
      description: string;
    };
    reviews?: string; // e.g., "reviews" or "відгуків"
  };
  onReviewsClick?: () => void;
}

// Consistent gradients for logo fallback based on name
const gradients = [
  "from-blue-400 to-cyan-500",
  "from-red-400 to-pink-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
  "from-purple-400 to-indigo-500",
];

export function HeroSection({
  info,
  ratingStats,
  isOwner,
  translations,
  onReviewsClick,
}: HeroSectionProps) {
  const initial = info.name.charAt(0).toUpperCase();
  const gradientIndex = info.name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  const hasReviews = ratingStats && ratingStats.totalReviews > 0;
  const reviewsLabel = translations.reviews ?? "reviews";

  return (
    <section className="space-y-3">
      {/* Avatar + Name row */}
      <div className="flex items-start gap-4">
        {/* Logo/Avatar */}
        {info.logo_url ? (
          <Image
            src={info.logo_url}
            alt={info.name}
            width={80}
            height={80}
            className="h-20 w-20 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-3xl font-bold text-white`}
          >
            {initial}
          </div>
        )}

        {/* Name, nickname, type + rating */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-semibold">{info.name}</h2>
                {info.is_verified && (
                  <VerifiedBadge translations={translations.verified} />
                )}
              </div>
              <p className="text-sm text-muted">@{info.slug}</p>
            </div>

            {/* Settings gear for owner */}
            {isOwner && (
              <CircleButton
                render={<Link href={`/${info.slug}/settings`} />}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </CircleButton>
            )}
          </div>

          {/* Type • Rating (reviews) */}
          <p className="flex items-center gap-1.5 text-sm text-muted">
            {info.type && <span>{info.type.name}</span>}
            {info.type && hasReviews && <span>•</span>}
            {hasReviews && (
              <button
                type="button"
                onClick={onReviewsClick}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">
                  {ratingStats.averageRating.toFixed(1)}
                </span>
                <span>
                  ({ratingStats.totalReviews} {reviewsLabel})
                </span>
              </button>
            )}
          </p>
        </div>
      </div>

      {/* Bio */}
      {info.creator_bio && (
        <p className="whitespace-pre-line text-sm">{info.creator_bio}</p>
      )}
    </section>
  );
}
