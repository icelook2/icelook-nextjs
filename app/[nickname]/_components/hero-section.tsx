import { Settings, Star } from "lucide-react";
import Link from "next/link";
import type { BeautyPageInfo } from "@/lib/queries/beauty-page-profile";
import { Avatar } from "@/lib/ui/avatar";
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

export function HeroSection({
  info,
  ratingStats,
  isOwner,
  translations,
  onReviewsClick,
}: HeroSectionProps) {
  const hasReviews = ratingStats && ratingStats.totalReviews > 0;
  const reviewsLabel = translations.reviews ?? "reviews";

  return (
    <section className="space-y-3">
      {/* Avatar + Name row */}
      <div className="flex items-start gap-4">
        {/* Logo/Avatar */}
        <Avatar
          url={info.creator_avatar_url ?? info.logo_url}
          name={info.name}
          size="xl"
          shape="rounded"
        />

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

          {/* Rating (reviews) */}
          {hasReviews && (
            <button
              type="button"
              onClick={onReviewsClick}
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
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
        </div>
      </div>

      {/* Bio */}
      {info.creator_bio && (
        <p className="whitespace-pre-line text-sm">{info.creator_bio}</p>
      )}
    </section>
  );
}
