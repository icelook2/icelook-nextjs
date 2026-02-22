"use client";

import {
  Accessibility,
  AlertTriangle,
  MessagesSquare,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { VisitPreferences } from "@/lib/types/visit-preferences";
import { Paper } from "@/lib/ui/paper";

interface VisitPreferencesCardProps {
  preferences: VisitPreferences;
}

const accessibilityLabels: Record<
  NonNullable<VisitPreferences["accessibility"]>[number],
  string
> = {
  wheelchair: "Wheelchair accessible",
  hearing_impaired: "Hearing impaired",
  vision_impaired: "Vision impaired",
  sensory_sensitivity: "Sensory sensitivity",
};

export function VisitPreferencesCard({
  preferences,
}: VisitPreferencesCardProps) {
  const { communication, accessibility, allergies } = preferences;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Visit Preferences</h2>

      <Paper className="divide-y divide-border">
        {/* Communication row */}
        {communication && (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/20">
              {communication === "quiet" && (
                <VolumeX className="h-3.5 w-3.5 text-muted" />
              )}
              {communication === "friendly" && (
                <Volume2 className="h-3.5 w-3.5 text-muted" />
              )}
              {communication === "chatty" && (
                <MessagesSquare className="h-3.5 w-3.5 text-muted" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted">Communication</p>
              <p className="text-sm text-foreground">
                {communication === "quiet" && "Prefers quiet"}
                {communication === "friendly" && "Open to chat"}
                {communication === "chatty" && "Loves conversation"}
              </p>
            </div>
          </div>
        )}

        {/* Accessibility row */}
        {accessibility && accessibility.length > 0 && (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Accessibility className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted">Accessibility</p>
              <p className="text-sm text-foreground">
                {accessibility
                  .map((need) => accessibilityLabels[need])
                  .join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Allergies row */}
        {allergies && (
          <div className="flex items-start gap-3 bg-warning/5 px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-warning">Allergies</p>
              <p className="text-sm text-foreground">{allergies}</p>
            </div>
          </div>
        )}
      </Paper>
    </section>
  );
}
