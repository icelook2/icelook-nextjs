import { Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { getUserPendingInvitations } from "@/lib/queries";
import { PageHeader } from "@/lib/ui/page-header";
import { Paper } from "@/lib/ui/paper";
import { InvitationCard } from "./_components";

export default async function InvitationsPage() {
  const t = await getTranslations("invitations");

  const profile = await getProfile();

  if (!profile) {
    redirect("/auth");
  }

  if (!profile.email) {
    // User has no email, can't receive invitations
    return (
      <>
        <PageHeader
          title={t("title")}
          backHref="/settings"
          containerClassName="mx-auto max-w-2xl"
        />

        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="text-muted">{t("no_email")}</p>
          </div>
        </div>
      </>
    );
  }

  const invitations = await getUserPendingInvitations(profile.email);

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        backHref="/settings"
        containerClassName="mx-auto max-w-2xl"
      />

      <div className="mx-auto max-w-2xl px-4">
        {invitations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
              <Mail className="h-6 w-6 text-accent" />
            </div>
            <p className="font-medium">{t("empty_title")}</p>
            <p className="text-sm text-muted">{t("empty_description")}</p>
          </div>
        ) : (
          <Paper>
            {invitations.map((invitation, index) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                noBorder={index === invitations.length - 1}
              />
            ))}
          </Paper>
        )}
      </div>
    </>
  );
}
