import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/lib/ui/page-header";

export default async function SearchPage() {
 const t = await getTranslations("search");

 return (
 <>
 <PageHeader
 title={t("title")}
 subtitle={t("subtitle")}
 containerClassName="mx-auto max-w-2xl"
 />

 <div className="mx-auto max-w-2xl px-4">
 {/* Empty state */}
 <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16">
 <p className="text-center text-sm text-muted">{t("empty_prompt")}</p>
 </div>
 </div>
 </>
 );
}
