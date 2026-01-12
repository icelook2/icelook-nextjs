"use client";

import { Check, Loader2, StickyNote } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { upsertClientNotes } from "@/app/[nickname]/settings/clients/_actions/clients.actions";
import { Paper } from "@/lib/ui/paper";

interface CreatorNotesEditableCardProps {
  beautyPageId: string;
  nickname: string;
  clientId: string | null;
  clientPhone: string;
  initialNotes: string | null;
}

export function CreatorNotesEditableCard({
  beautyPageId,
  nickname,
  clientId,
  clientPhone,
  initialNotes,
}: CreatorNotesEditableCardProps) {
  const t = useTranslations("appointment_details.creator_notes");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const [showSaved, setShowSaved] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const hasChanges = notes !== savedNotes;
  const maxLength = 5000;

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges) {
      return;
    }

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce save (1 second after user stops typing)
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await upsertClientNotes({
          beautyPageId,
          nickname,
          clientId,
          clientPhone,
          notes,
        });

        if (result.success) {
          setSavedNotes(notes);
          setShowSaved(true);

          // Hide saved indicator after 2 seconds
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setShowSaved(false);
          }, 2000);
        }
      });
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [notes, hasChanges, beautyPageId, nickname, clientId, clientPhone]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <div className="flex items-center gap-2 text-sm">
          {isPending && (
            <span className="flex items-center gap-1 text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("saving")}
            </span>
          )}
          {showSaved && !isPending && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              {t("saved")}
            </span>
          )}
        </div>
      </div>

      <Paper className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
            <StickyNote className="h-5 w-5" />
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("placeholder")}
            rows={3}
            className="w-full resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted focus:outline-none"
            maxLength={maxLength}
          />
        </div>
      </Paper>

      <p className="text-xs text-muted">{t("hint")}</p>
    </section>
  );
}
