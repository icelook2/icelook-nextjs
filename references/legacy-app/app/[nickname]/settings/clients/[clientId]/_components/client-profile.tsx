"use client";

import type { BeautyPageClient } from "@/lib/queries/clients";
import { Avatar } from "@/lib/ui/avatar";

interface ClientProfileProps {
  client: BeautyPageClient;
}

export function ClientProfile({ client }: ClientProfileProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <Avatar size="lg" name={client.clientName} />
      <h2 className="text-xl font-semibold">{client.clientName}</h2>
    </div>
  );
}
