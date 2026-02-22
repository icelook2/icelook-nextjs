import { redirect } from "next/navigation";
import { resolvePostLoginDestination } from "@/lib/auth/landing";
import { getUser } from "@/lib/auth/session";

export default async function RootPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth");
  }

  redirect(await resolvePostLoginDestination(user.id));
}
