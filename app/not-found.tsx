import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("not_found");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">
          {t("code")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg">
          {t("title")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-violet-500 hover:text-violet-600 transition-colors"
        >
          {t("go_home")}
        </Link>
      </div>
    </div>
  );
}
