import Link from "next/link";
import { Store, MapPin } from "lucide-react";

interface Salon {
  id: string;
  name: string;
  slug: string;
  city: string;
}

interface OrganizationSalonsProps {
  salons: Salon[];
  title: string;
  emptyText: string;
}

export function OrganizationSalons({
  salons,
  title,
  emptyText,
}: OrganizationSalonsProps) {
  if (salons.length === 0) {
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
        {salons.map((salon) => (
          <Link
            key={salon.id}
            href={`/salon/${salon.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-violet-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-violet-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{salon.name}</p>
              <div className="flex items-center gap-1 text-sm text-foreground/60">
                <MapPin className="h-3 w-3" />
                <span>{salon.city}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
