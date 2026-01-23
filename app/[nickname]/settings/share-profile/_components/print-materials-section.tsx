"use client";

import { pdf } from "@react-pdf/renderer";
import { CreditCard, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";
import { Button } from "@/lib/ui/button";
import { SettingsGroup, SettingsRow } from "@/lib/ui/settings-group";
import { BusinessCardPdf } from "../_lib/pdf-templates/business-card-pdf";
import { PosterPdf } from "../_lib/pdf-templates/poster-pdf";
import type { PdfProfileData } from "../_lib/pdf-types";

interface PrintMaterialsSectionProps {
  name: string;
  nickname: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  profileUrl: string;
}

type GeneratingState = "idle" | "business-card" | "poster";

export function PrintMaterialsSection({
  name,
  nickname,
  avatarUrl,
  rating,
  reviewCount,
  profileUrl,
}: PrintMaterialsSectionProps) {
  const t = useTranslations("share_profile");
  const [generating, setGenerating] = useState<GeneratingState>("idle");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  function getQrCodeDataUrl(): string {
    const canvas = qrCanvasRef.current;
    if (!canvas) {
      return "";
    }
    return canvas.toDataURL("image/png");
  }

  function getPdfData(): PdfProfileData {
    return {
      name,
      nickname,
      avatarUrl,
      rating,
      reviewCount,
      profileUrl,
      qrCodeDataUrl: getQrCodeDataUrl(),
    };
  }

  async function downloadPdf(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleBusinessCardDownload() {
    setGenerating("business-card");
    try {
      const data = getPdfData();
      const blob = await pdf(<BusinessCardPdf data={data} />).toBlob();
      await downloadPdf(blob, `${nickname}-business-card.pdf`);
    } finally {
      setGenerating("idle");
    }
  }

  async function handlePosterDownload() {
    setGenerating("poster");
    try {
      const data = getPdfData();
      const scanText = t("scan_to_book");
      const blob = await pdf(
        <PosterPdf data={data} scanText={scanText} />,
      ).toBlob();
      await downloadPdf(blob, `${nickname}-poster.pdf`);
    } finally {
      setGenerating("idle");
    }
  }

  return (
    <SettingsGroup
      title={t("print_materials.title")}
      description={t("print_materials.description")}
    >
      {/* Hidden QR code canvas for PDF generation */}
      <div className="sr-only" aria-hidden="true">
        <QRCodeCanvas
          ref={qrCanvasRef}
          value={profileUrl}
          size={512}
          level="M"
          marginSize={1}
        />
      </div>

      <SettingsRow className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          onClick={handleBusinessCardDownload}
          loading={generating === "business-card"}
          disabled={generating !== "idle"}
          className="w-full justify-start sm:w-auto"
        >
          <CreditCard className="h-4 w-4" />
          <span className="flex flex-col items-start">
            <span>{t("print_materials.business_card")}</span>
            <span className="text-xs font-normal text-muted">
              {t("print_materials.business_card_description")}
            </span>
          </span>
        </Button>

        <Button
          variant="secondary"
          onClick={handlePosterDownload}
          loading={generating === "poster"}
          disabled={generating !== "idle"}
          className="w-full justify-start sm:w-auto"
        >
          <FileText className="h-4 w-4" />
          <span className="flex flex-col items-start">
            <span>{t("print_materials.poster")}</span>
            <span className="text-xs font-normal text-muted">
              {t("print_materials.poster_description")}
            </span>
          </span>
        </Button>
      </SettingsRow>
    </SettingsGroup>
  );
}
