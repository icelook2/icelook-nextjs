import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getUserBeautyPages } from "@/lib/queries";
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
        containerClassName="mx-auto max-w-2xl"
      >
        <Link href="/settings">
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
            <Link href="/settings" className="mt-4 inline-block">
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
                className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/50 hover:bg-accent-soft/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent transition-colors group-hover:bg-accent/20">
                    <span className="text-lg font-semibold">
                      {page.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
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
