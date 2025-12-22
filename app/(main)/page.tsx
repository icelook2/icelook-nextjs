import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/lib/ui/page-header";

export default async function HomePage() {
 const t = await getTranslations("home");

 return (
 <>
 <PageHeader title={t("title")} containerClassName="mx-auto max-w-2xl" />

 <div className="mx-auto max-w-2xl px-4">
 <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-surface py-24">
 <p className="text-muted">Welcome to Icelook</p>
 </div>
 </div>
 </>
 );
}
