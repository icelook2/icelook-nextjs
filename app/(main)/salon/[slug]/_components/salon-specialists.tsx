import Link from "next/link";
import { User } from "lucide-react";

interface Specialist {
  id: string;
  username: string;
  display_name: string;
  specialty: string | null;
}

interface SalonSpecialistsProps {
  specialists: Specialist[];
  title: string;
  emptyText: string;
}

export function SalonSpecialists({
  specialists,
  title,
  emptyText,
}: SalonSpecialistsProps) {
  if (specialists.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-foreground/60">{emptyText}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <div className="space-y-2">
        {specialists.map((specialist) => (
          <Link
            key={specialist.id}
            href={`/@${specialist.username}`}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-violet-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {specialist.display_name}
              </p>
              {specialist.specialty && (
                <p className="text-sm text-foreground/60">
                  {specialist.specialty}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
