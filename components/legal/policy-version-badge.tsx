import { getTranslations } from "next-intl/server";
import type { PolicyLocale } from "@/lib/types/legal";
import { formatEffectiveDate } from "@/lib/types/legal";

interface PolicyVersionBadgeProps {
  version: string;
  effectiveDate: string;
  locale: PolicyLocale;
}

export async function PolicyVersionBadge({
  version,
  effectiveDate,
  locale,
}: PolicyVersionBadgeProps) {
  const t = await getTranslations("legal");

  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span className="rounded-md bg-surface-alt px-2 py-0.5 font-medium">
        v{version}
      </span>
      <span>
        {t("effective_date", {
          date: formatEffectiveDate(effectiveDate, locale),
        })}
      </span>
    </div>
  );
}
