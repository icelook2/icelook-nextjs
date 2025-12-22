import { Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getBeautyPageByNickname } from "@/lib/queries";
import { Button } from "@/lib/ui/button";
import { PageHeader } from "@/lib/ui/page-header";

interface BeautyPageProps {
 params: Promise<{ nickname: string }>;
}

export default async function BeautyPage({ params }: BeautyPageProps) {
 const { nickname } = await params;
 const t = await getTranslations("beauty_page");

 const beautyPage = await getBeautyPageByNickname(nickname);

 if (!beautyPage) {
 notFound();
 }

 const profile = await getProfile();
 const isOwner = profile?.id === beautyPage.owner_id;

 return (
 <>
 <PageHeader
 title={beautyPage.name}
 subtitle={`@${beautyPage.slug}`}
 backHref="/"
 containerClassName="mx-auto max-w-2xl"
 >
 {isOwner && (
 <Link href={`/${nickname}/settings`}>
 <Button variant="ghost" size="sm">
 <Settings className="h-4 w-4" />
 {t("settings")}
 </Button>
 </Link>
 )}
 </PageHeader>

 <div className="mx-auto max-w-2xl px-4">
 {/* Avatar and type badge */}
 <div className="mb-6 flex items-center gap-4">
 <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
 <span className="text-2xl font-semibold">
 {beautyPage.name.charAt(0).toUpperCase()}
 </span>
 </div>
 <div>
 <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
 {beautyPage.beauty_page_types[0]?.name}
 </span>
 </div>
 </div>

 {/* Description */}
 {beautyPage.description && (
 <p className="mb-8 text-muted">{beautyPage.description}</p>
 )}

 {/* Empty state for services */}
 <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
 <h2 className="text-lg font-semibold">
 {t("no_services_title")}
 </h2>
 <p className="mt-2 text-sm text-muted">
 {t("no_services_description")}
 </p>
 </div>
 </div>
 </>
 );
}
