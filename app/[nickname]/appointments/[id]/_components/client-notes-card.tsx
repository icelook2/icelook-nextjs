"use client";

import { MessageSquare } from "lucide-react";
import { Paper } from "@/lib/ui/paper";

interface ClientNotesCardProps {
  notes: string;
}

export function ClientNotesCard({ notes }: ClientNotesCardProps) {
  return (
    <Paper className="p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted">
        <MessageSquare className="h-4 w-4" />
        <span>Notes from Client</span>
      </div>

      <p className="mt-2 text-foreground">{notes}</p>
    </Paper>
  );
}
