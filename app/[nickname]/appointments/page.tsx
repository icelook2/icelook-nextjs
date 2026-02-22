interface SpecialistAppointmentsPageProps {
  params: Promise<{ nickname: string }>;
}

export default async function SpecialistAppointmentsPage({
  params,
}: SpecialistAppointmentsPageProps) {
  const { nickname } = await params;

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{nickname} Appointments</h1>
      <p className="mt-2 text-sm text-muted">
        Specialist schedule view will be restored in this route.
      </p>
    </section>
  );
}
