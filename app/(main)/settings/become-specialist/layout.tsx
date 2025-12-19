import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { WizardProvider } from "./_lib/wizard-context";

interface BecomeSpecialistLayoutProps {
  children: React.ReactNode;
}

export default async function BecomeSpecialistLayout({
  children,
}: BecomeSpecialistLayoutProps) {
  const profile = await getProfile();
  const t = await getTranslations("specialist.wizard");

  // Must be logged in
  if (!profile) {
    redirect("/auth?redirect=/settings/become-specialist");
  }

  // Check if user is already a specialist
  const supabase = await createClient();
  const { data: specialist } = await supabase
    .from("specialists")
    .select("id, username")
    .eq("user_id", profile.id)
    .single();

  // If already a specialist, redirect to their profile
  if (specialist) {
    redirect(`/@${specialist.username}/settings`);
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

        <WizardProvider>{children}</WizardProvider>
      </div>
    </div>
  );
}
