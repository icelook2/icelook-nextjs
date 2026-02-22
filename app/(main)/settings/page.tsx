import { SignOutButton } from "@/components/auth/sign-out-button";
import { getUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <section className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-muted">
        {user?.email
          ? `Account settings for ${user.email}.`
          : "Manage your account settings."}
      </p>
      <SignOutButton />
    </section>
  );
}
