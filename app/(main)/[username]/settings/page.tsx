import { redirect } from "next/navigation";

interface SpecialistSettingsPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function SpecialistSettingsPage({
  params,
}: SpecialistSettingsPageProps) {
  const { username } = await params;

  // Redirect to profile settings by default
  redirect(`/@${username}/settings/profile`);
}
