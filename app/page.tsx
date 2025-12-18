import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="absolute right-4 top-4 flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
    </div>
  );
}
