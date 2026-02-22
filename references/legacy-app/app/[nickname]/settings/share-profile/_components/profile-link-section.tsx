"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { useCopyToClipboard } from "../_lib/use-copy-to-clipboard";

interface ProfileLinkSectionProps {
  profileUrl: string;
}

export function ProfileLinkSection({ profileUrl }: ProfileLinkSectionProps) {
  const t = useTranslations("share_profile.link");
  const { copy, status } = useCopyToClipboard();

  const isCopied = status === "copied";

  return (
    <SettingsGroup title={t("title")} description={t("description")}>
      <SettingsRow noBorder>
        <div className="flex gap-3">
          <Input
            value={profileUrl}
            readOnly
            className="flex-1 font-mono text-sm"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button
            variant="secondary"
            size="icon"
            onClick={() => copy(profileUrl)}
            aria-label={isCopied ? t("copied") : t("copy")}
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-positive" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SettingsRow>
    </SettingsGroup>
  );
}
