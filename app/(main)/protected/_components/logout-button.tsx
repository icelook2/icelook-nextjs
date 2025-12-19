"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { signOut } from "@/app/auth/actions";

export function LogoutButton() {
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(() => {
      signOut();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {isPending ? t("signing_out") : t("sign_out")}
    </button>
  );
}
