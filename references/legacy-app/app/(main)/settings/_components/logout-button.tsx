"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/lib/ui/button";

export function LogoutButton() {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      loading={isPending}
      className="w-full justify-center text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {t("logout_button")}
    </Button>
  );
}
