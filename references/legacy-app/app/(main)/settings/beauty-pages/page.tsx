import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getUserBeautyPages } from "@/lib/queries";
import { Avatar } from "@/lib/ui/avatar";
import { Button } from "@/lib/ui/button";
import { PageHeader } from "@/lib/ui/page-header";

export default async function BeautyPagesPage() {
  const t = await getTranslations("beauty_pages");
  const profile = await getProfile();

  const beautyPages = await getUserBeautyPages(profile?.id);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        backHref=""
        containerClassName="mx-auto max-w-2xl"
      >
        <Link href="/create-beauty-page">
          <Button variant="secondary" size="sm">
            <Plus className="h-4 w-4" />
            {t("create_new")}
          </Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-2xl px-4">
        {beautyPages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
            <h2 className="text-lg font-semibold">{t("empty_title")}</h2>
            <p className="mt-2 text-sm text-muted">{t("empty_description")}</p>
            <Link href="/create-beauty-page" className="mt-4 inline-block">
              <Button>
                <Plus className="h-4 w-4" />
                {t("create_first")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {beautyPages.map((page) => (
              <Link
                key={page.id}
                href={`/${page.slug}`}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    url={page.avatar_url}
                    name={page.name}
                    size="md"
                    shape="rounded"
                  />
                  <div>
                    <h3 className="font-semibold">{page.name}</h3>
                    <p className="text-sm text-muted">@{page.slug}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
