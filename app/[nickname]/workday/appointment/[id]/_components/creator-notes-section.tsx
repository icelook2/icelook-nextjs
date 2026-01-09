"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { Paper } from "@/lib/ui/paper";
import { cn } from "@/lib/utils/cn";
import { updateAppointmentNotes } from "../../../../settings/schedule/_actions/appointment.actions";

interface CreatorNotesSectionProps {
  appointmentId: string;
  beautyPageId: string;
  nickname: string;
  initialNotes: string | null;
}

export function CreatorNotesSection({
  appointmentId,
  beautyPageId,
  nickname,
  initialNotes,
}: CreatorNotesSectionProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [showSaved, setShowSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initialNotesRef = useRef(initialNotes);

  // Auto-save with debounce
  useEffect(() => {
    // Don't save if notes haven't changed from initial
    if (notes === (initialNotesRef.current ?? "")) {
      return;
    }

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for auto-save
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await updateAppointmentNotes({
          appointmentId,
          beautyPageId,
          nickname,
          notes,
        });

        if (result.success) {
          initialNotesRef.current = notes;
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 2000);
        }
      });
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [notes, appointmentId, beautyPageId, nickname]);

  return (
    <Paper className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-medium text-muted">Your Notes</h3>
          <span className="text-xs text-muted/60">(private)</span>
        </div>
        <div className="h-5">
          {isPending && (
            <span className="text-xs text-muted">Saving...</span>
          )}
          {showSaved && !isPending && (
            <span className="text-xs text-green-600 dark:text-green-400">
              Saved
            </span>
          )}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add private notes about this appointment..."
        className={cn(
          "w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted/50",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
          "min-h-[80px]",
        )}
      />
    </Paper>
  );
}
