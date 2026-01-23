import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MarkdownContent } from "@/components/legal/markdown-content";
import { PolicyVersionBadge } from "@/components/legal/policy-version-badge";
import { getLocale } from "@/i18n/get-locale";
import { getCurrentPolicy } from "@/lib/queries/legal";
import type { PolicyLocale } from "@/lib/types/legal";
import { Paper } from "@/lib/ui/paper";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");

  return {
    title: `${t("privacy_title")} | Icelook`,
    description: t("privacy_description"),
  };
}

export default async function PrivacyPolicyPage() {
  const locale = (await getLocale()) as PolicyLocale;
  const policy = await getCurrentPolicy("privacy", locale);

  if (!policy) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Paper className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="mb-3 text-2xl font-bold sm:text-3xl">{policy.title}</h1>
          <PolicyVersionBadge
            version={policy.version}
            effectiveDate={policy.effective_date}
            locale={locale}
          />
        </div>

        {/* Content */}
        <MarkdownContent content={policy.content} />
      </Paper>
    </div>
  );
}
