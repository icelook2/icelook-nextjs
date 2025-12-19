import { getTranslations } from "next-intl/server";

export default async function SearchPage() {
  const t = await getTranslations("search");

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

        {/* Empty state */}
        <div className="flex items-center justify-center rounded-lg border border-border bg-background/50 py-12">
          <p className="text-center text-sm text-foreground/60">
            {t("empty")}
          </p>
        </div>
      </div>
    </div>
  );
}
