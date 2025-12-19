"use client";

import { Search, User } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar } from "@/lib/ui/avatar";
import type { SearchResult } from "../actions";
import { EmptyState } from "./empty-state";

interface SearchResultsProps {
  results: SearchResult[];
  query?: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  const t = useTranslations("search");
  const specialtyT = useTranslations("specialist.specialties");

  // Empty state: no query yet
  if (!query || query.trim().length === 0) {
    return <EmptyState icon={Search}>{t("empty_prompt")}</EmptyState>;
  }

  // Empty state: no results found
  if (results.length === 0) {
    return <EmptyState icon={User}>{t("no_results", { query })}</EmptyState>;
  }

  // Results list
  return (
    <ul className="space-y-3" aria-label={t("results_label")}>
      {results.map((specialist) => (
        <SpecialistCard
          key={specialist.id}
          specialist={specialist}
          specialtyLabel={specialtyT(specialist.specialty)}
        />
      ))}
    </ul>
  );
}

interface SpecialistCardProps {
  specialist: SearchResult;
  specialtyLabel: string;
}

function SpecialistCard({ specialist, specialtyLabel }: SpecialistCardProps) {
  return (
    <li>
      <Link
        href={`/@${specialist.username}`}
        className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-background p-4 transition-colors hover:border-foreground/20 hover:bg-foreground/5"
      >
        {/* Avatar */}
        <Avatar url={specialist.avatar_url} name={specialist.display_name} />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">
            {specialist.display_name}
          </p>
          <p className="truncate text-sm text-foreground/60">
            @{specialist.username}
          </p>
        </div>

        {/* Specialty badge */}
        <span className="hidden shrink-0 rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-600 dark:text-violet-400 sm:block">
          {specialtyLabel}
        </span>
      </Link>
    </li>
  );
}
