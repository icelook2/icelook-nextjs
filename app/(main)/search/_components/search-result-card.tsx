import { BadgeCheck, MapPin } from "lucide-react";
import Link from "next/link";
import type { BeautyPageSearchResult } from "@/lib/queries/search";
import { Avatar } from "@/lib/ui/avatar";

interface SearchResultCardProps {
  result: BeautyPageSearchResult;
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <Link
      href={`/${result.slug}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
    >
      {/* Avatar */}
      <Avatar
        url={result.logo_url}
        name={result.name}
        size="lg"
        shape="rounded"
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        {/* Name row with verified badge */}
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-semibold">{result.name}</h3>
          {result.is_verified && (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-accent"
              aria-label="Verified"
            />
          )}
        </div>

        {/* Nickname */}
        <p className="truncate text-sm text-muted">@{result.slug}</p>

        {/* Category and City */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {result.type_name && (
            <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              {result.type_name}
            </span>
          )}
          {result.city && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {result.city}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
