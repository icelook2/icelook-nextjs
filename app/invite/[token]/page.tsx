import { Check, LogOut, X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/lib/ui/button";
import { AcceptDeclineButtons } from "./_components/accept-decline-buttons";

interface InvitePageProps {
 params: Promise<{ token: string }>;
}

interface InvitationData {
 id: string;
 beauty_page_id: string;
 beauty_page_name: string;
 beauty_page_slug: string;
 email: string;
 roles: ("admin" | "specialist")[];
 status: "pending" | "accepted" | "declined";
 invited_by_name: string | null;
 created_at: string;
}

async function getInvitationByToken(
 token: string,
): Promise<InvitationData | null> {
 const supabase = await createClient();

 const { data, error } = await supabase.rpc("get_invitation_by_token", {
 invite_token: token,
 });

 if (error || !data || data.length === 0) {
 return null;
 }

 const row = data[0];
 return {
 id: row.id,
 beauty_page_id: row.beauty_page_id,
 beauty_page_name: row.beauty_page_name,
 beauty_page_slug: row.beauty_page_slug,
 email: row.email,
 roles: row.roles,
 status: row.status,
 invited_by_name: row.invited_by_name,
 created_at: row.created_at,
 };
}

function formatRoles(
 roles: ("admin" | "specialist")[],
 t: Awaited<ReturnType<typeof getTranslations>>,
): string {
 return roles.map((role) => t(`role_${role}`)).join(" & ");
}

export default async function InvitePage({ params }: InvitePageProps) {
 const { token } = await params;
 const t = await getTranslations("invite");

 const invitation = await getInvitationByToken(token);

 if (!invitation) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-background px-4">
 <div className="w-full max-w-md text-center">
 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full dark:bg-/30">
 <X className="h-8 w-8 text-" />
 </div>
 <h1 className="mb-2 text-xl font-semibold">
 {t("invalid_title")}
 </h1>
 <p className="text-">{t("invalid_description")}</p>
 <Link href="/" className="mt-6 inline-block">
 <Button variant="ghost">{t("go_home")}</Button>
 </Link>
 </div>
 </div>
 );
 }

 // Check if invitation is already processed
 if (invitation.status !== "pending") {
 return (
 <div className="flex min-h-screen items-center justify-center bg-background px-4">
 <div className="w-full max-w-md text-center">
 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full  dark:">
 {invitation.status === "accepted" ? (
 <Check className="h-8 w-8 text-" />
 ) : (
 <X className="h-8 w-8 " />
 )}
 </div>
 <h1 className="mb-2 text-xl font-semibold">
 {invitation.status === "accepted"
 ? t("already_accepted_title")
 : t("already_declined_title")}
 </h1>
 <p className="text-">
 {invitation.status === "accepted"
 ? t("already_accepted_description", {
 name: invitation.beauty_page_name,
 })
 : t("already_declined_description")}
 </p>
 {invitation.status === "accepted" && (
 <Link
 href={`/${invitation.beauty_page_slug}`}
 className="mt-6 inline-block"
 >
 <Button>{t("go_to_page")}</Button>
 </Link>
 )}
 </div>
 </div>
 );
 }

 const profile = await getProfile();

 // Not logged in - redirect to auth with return URL
 if (!profile) {
 const returnUrl = encodeURIComponent(`/invite/${token}`);
 redirect(`/auth?next=${returnUrl}`);
 }

 // Logged in but email doesn't match
 if (profile.email?.toLowerCase() !== invitation.email.toLowerCase()) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-background px-4">
 <div className="w-full max-w-md text-center">
 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full dark:bg-/30">
 <LogOut className="h-8 w-8 text-" />
 </div>
 <h1 className="mb-2 text-xl font-semibold">
 {t("wrong_account_title")}
 </h1>
 <p className="mb-4 text-">
 {t("wrong_account_description", { email: invitation.email })}
 </p>
 <p className="text-sm text-">
 {t("logged_in_as", { email: profile.email ?? "" })}
 </p>
 <Link href="/auth/signout" className="mt-6 inline-block">
 <Button variant="ghost">
 <LogOut className="mr-2 h-4 w-4" />
 {t("sign_out")}
 </Button>
 </Link>
 </div>
 </div>
 );
 }

 // Logged in with matching email - show invitation
 return (
 <div className="flex min-h-screen items-center justify-center bg-background px-4">
 <div className="w-full max-w-md">
 <div className="rounded-2xl border  p-8 text-center shadow-lg dark:">
 <h1 className="mb-2 text-xl font-semibold">
 {t("title")}
 </h1>
 <p className="mb-6 text-">
 {t("description", {
 inviter: invitation.invited_by_name ?? t("someone"),
 name: invitation.beauty_page_name,
 })}
 </p>

 <div className="mb-6 rounded-lg p-4">
 <p className="text-sm text-">{t("role_label")}</p>
 <p className="font-medium">
 {formatRoles(invitation.roles, t)}
 </p>
 </div>

 <AcceptDeclineButtons
 invitationId={invitation.id}
 beautyPageSlug={invitation.beauty_page_slug}
 />
 </div>
 </div>
 </div>
 );
}
