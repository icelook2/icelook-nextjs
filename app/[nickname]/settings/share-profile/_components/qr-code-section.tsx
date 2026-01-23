"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { Button } from "@/lib/ui/button";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";

interface QrCodeSectionProps {
  profileUrl: string;
  nickname: string;
}

export function QrCodeSection({ profileUrl, nickname }: QrCodeSectionProps) {
  const t = useTranslations("share_profile.qr_code");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nickname}-qr-code.png`;
    link.click();
  }

  return (
    <SettingsGroup title={t("title")} description={t("description")}>
      <SettingsRow noBorder>
        <div className="flex flex-col items-center gap-4">
          {/* Display QR code */}
          <div className="rounded-2xl bg-white p-4">
            <QRCodeSVG value={profileUrl} size={200} level="M" marginSize={0} />
          </div>

          {/* Hidden canvas for PNG download (higher resolution) */}
          <div className="sr-only" aria-hidden="true">
            <QRCodeCanvas
              ref={canvasRef}
              value={profileUrl}
              size={512}
              level="M"
              marginSize={1}
            />
          </div>

          <Button variant="secondary" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            {t("download")}
          </Button>
        </div>
      </SettingsRow>
    </SettingsGroup>
  );
}
