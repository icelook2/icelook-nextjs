"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/lib/ui/button";

interface EmailDisplayProps {
 email: string;
 onChangeClick: () => void;
}

export function EmailDisplay({ email, onChangeClick }: EmailDisplayProps) {
 const t = useTranslations("settings");

 return (
 <div className="flex items-center justify-between rounded-lg border p-4">
 <div>
 <p className="text-sm text-">{t("current_email")}</p>
 <p className="font-medium">{email}</p>
 </div>
 <Button
 type="button"
 variant="secondary"
 size="sm"
 onClick={onChangeClick}
 >
 {t("change_email")}
 </Button>
 </div>
 );
}
