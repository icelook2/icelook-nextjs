import { redirect } from "next/navigation";

/**
 * Redirects to the first step of the wizard
 */
export default function BecomeSpecialistPage() {
  redirect("/settings/become-specialist/profile");
}
