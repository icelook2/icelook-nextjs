import { getUser } from "@/lib/auth/session";

export default async function AppointmentsPage() {
  const user = await getUser();

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <p className="mt-2 text-sm text-muted">
        {user?.email
          ? `Signed in as ${user.email}.`
          : "Your upcoming appointments will appear here."}
      </p>
    </section>
  );
}
