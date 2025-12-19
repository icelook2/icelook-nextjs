import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";

interface CreateBusinessLayoutProps {
  children: React.ReactNode;
}

export default async function CreateBusinessLayout({
  children,
}: CreateBusinessLayoutProps) {
  const profile = await getProfile();
  const t = await getTranslations("business.wizard");

  // Must be logged in
  if (!profile) {
    redirect("/auth?redirect=/settings/create-business");
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-foreground/60">{t("subtitle")}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
