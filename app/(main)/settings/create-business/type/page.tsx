import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Store, Building } from "lucide-react";

export default async function BusinessTypePage() {
  const t = await getTranslations("business.wizard");

  return (
    <div className="space-y-6">
      <p className="text-center text-foreground/70">{t("select_entity_type")}</p>

      <div className="grid gap-4">
        {/* Salon */}
        <Link
          href="/settings/create-business/salon/profile"
          className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-violet-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-600"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-500 group-hover:text-white dark:bg-violet-900/30 dark:text-violet-400 dark:group-hover:bg-violet-500 dark:group-hover:text-white">
            <Store className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">
              {t("salon_title")}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {t("salon_description")}
            </p>
          </div>
        </Link>

        {/* Organization */}
        <Link
          href="/settings/create-business/organization/profile"
          className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-violet-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-600"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-500 group-hover:text-white dark:bg-violet-900/30 dark:text-violet-400 dark:group-hover:bg-violet-500 dark:group-hover:text-white">
            <Building className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">
              {t("organization_title")}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {t("organization_description")}
            </p>
          </div>
        </Link>
      </div>

      <div className="text-center">
        <Link
          href="/settings/create-business"
          className="text-sm text-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
