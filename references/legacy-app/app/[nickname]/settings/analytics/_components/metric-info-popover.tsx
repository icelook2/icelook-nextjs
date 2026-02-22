"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover } from "@/lib/ui/popover";

interface MetricInfoPopoverProps {
  infoKey: string;
}

export function MetricInfoPopover({ infoKey }: MetricInfoPopoverProps) {
  const t = useTranslations("analytics.info");

  return (
    <Popover.Root>
      <Popover.Trigger className="flex items-center justify-center rounded-full p-1 text-on-surface-muted transition-colors hover:bg-surface-muted hover:text-on-surface">
        <Info className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="max-w-xs p-3" side="left" align="center">
          <p className="text-sm text-on-surface">{t(infoKey)}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
