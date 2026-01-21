import { BadgeCheck } from "lucide-react";
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
      className="flex items-center gap-3 rounded-lg py-3 transition-colors hover:bg-surface-hover"
    >
      <Avatar
        url={result.logo_url}
        name={result.name}
        size="md"
        shape="rounded"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1">
          <span className="truncate font-semibold">{result.slug}</span>
          {result.is_verified && (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-accent"
              aria-label="Verified"
            />
          )}
        </div>
        <span className="truncate text-sm text-muted">{result.name}</span>
        {result.type_name && (
          <span className="truncate text-xs text-muted">
            {result.type_name}
          </span>
        )}
      </div>
    </Link>
  );
}
