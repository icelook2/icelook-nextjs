import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { User, Building2 } from "lucide-react";

export default async function CreateBusinessPage() {
  const t = await getTranslations("business.wizard");

  return (
    <div className="space-y-6">
      <p className="text-center text-foreground/70">{t("select_type")}</p>

      <div className="grid gap-4">
        {/* Individual (Specialist) */}
        <Link
          href="/settings/become-specialist"
          className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-violet-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-600"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-500 group-hover:text-white dark:bg-violet-900/30 dark:text-violet-400 dark:group-hover:bg-violet-500 dark:group-hover:text-white">
            <User className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">
              {t("individual_title")}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {t("individual_description")}
            </p>
          </div>
        </Link>

        {/* Business (Salon or Organization) */}
        <Link
          href="/settings/create-business/type"
          className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-violet-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-600"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-500 group-hover:text-white dark:bg-violet-900/30 dark:text-violet-400 dark:group-hover:bg-violet-500 dark:group-hover:text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">
              {t("business_title")}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {t("business_description")}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
