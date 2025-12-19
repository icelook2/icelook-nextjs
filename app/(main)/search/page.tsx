import { getTranslations } from "next-intl/server";
import { SearchInput } from "./_components/search-input";
import { SearchResults } from "./_components/search-results";
import { searchSpecialists } from "./actions";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const t = await getTranslations("search");
  const { q } = await searchParams;

  // Perform initial search if query exists
  const results = q ? await searchSpecialists(q) : [];

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="text-foreground/60">{t("subtitle")}</p>
        </div>

        {/* Search Input */}
        <SearchInput defaultValue={q} />

        {/* Results */}
        <SearchResults results={results} query={q} />
      </div>
    </div>
  );
}
