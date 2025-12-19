import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
    </div>
  );
}
