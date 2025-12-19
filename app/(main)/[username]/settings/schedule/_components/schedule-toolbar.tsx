"use client";

import { Settings, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ScheduleConfig } from "@/lib/schedule/types";
import { Button } from "@/lib/ui/button";
import { ConfigModal } from "./config-modal";
import { PatternGeneratorModal } from "./pattern-generator-modal";

interface ScheduleToolbarProps {
  specialistId: string;
  config: ScheduleConfig;
  onConfigChange: (config: ScheduleConfig) => void;
  onPatternGenerated: () => void;
}

export function ScheduleToolbar({
  specialistId,
  config,
  onConfigChange,
  onPatternGenerated,
}: ScheduleToolbarProps) {
  const t = useTranslations("schedule");
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={() => setShowPatternModal(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          {t("generate_schedule")}
        </Button>

        <Button variant="secondary" onClick={() => setShowConfigModal(true)}>
          <Settings className="h-4 w-4 mr-2" />
          {t("settings")}
        </Button>
      </div>

      {showPatternModal && (
        <PatternGeneratorModal
          specialistId={specialistId}
          onClose={() => setShowPatternModal(false)}
          onGenerated={() => {
            setShowPatternModal(false);
            onPatternGenerated();
          }}
        />
      )}

      {showConfigModal && (
        <ConfigModal
          specialistId={specialistId}
          config={config}
          onClose={() => setShowConfigModal(false)}
          onSaved={(newConfig) => {
            onConfigChange(newConfig);
            setShowConfigModal(false);
          }}
        />
      )}
    </>
  );
}
