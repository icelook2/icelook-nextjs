"use client";

import { ArrowLeft, ChevronRight, LogOut, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import { signOut } from "@/app/auth/actions";
import { Popover } from "@/lib/ui/popover";
import { LanguageSelector } from "../language-selector";
import { ThemeSelector } from "../theme-selector";

interface ProfileMenuProps {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  /** If true, displays in a compact mobile-friendly format */
  compact?: boolean;
}

type MenuView = "main" | "appearance" | "language";

export function ProfileMenu({ profile, compact = false }: ProfileMenuProps) {
  const t = useTranslations("profile_menu");
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<MenuView>("main");

  function handleLogout() {
    startTransition(async () => {
      await signOut();
    });
  }

  if (!profile) {
    return null;
  }

  return (
    <Popover.Root
      onOpenChange={(open) => {
        // Reset to main view when closing
        if (!open) {
          setView("main");
        }
      }}
    >
      <Popover.Trigger
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-neutral-600 transition-all hover:bg-surface hover:text-white"
        aria-label="Open menu"
      >
        <Menu className="h-7 w-7" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content side="top" align="end" className="min-w-[280px] p-1">
          {view === "main" && (
            <div className="flex flex-col gap-0.5">
              {/* Appearance Item */}
              <button
                type="button"
                onClick={() => setView("appearance")}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="text-base text-text">{t("appearance")}</span>
                <ChevronRight className="h-5 w-5 text-text/60" />
              </button>

              {/* Language Item */}
              <button
                type="button"
                onClick={() => setView("language")}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="text-base text-text">{t("language")}</span>
                <ChevronRight className="h-5 w-5 text-text/60" />
              </button>

              {/* Settings Item */}
              <Link
                href="/settings"
                className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span className="text-base text-text">{t("settings")}</span>
                <ChevronRight className="h-5 w-5 text-text/60" />
              </Link>

              {/* Divider */}
              <div className="my-1 h-px bg-text/10" />

              {/* Log out Item */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                <LogOut className="h-5 w-5 text-red-500" />
                <span className="text-base text-red-500">
                  {isPending ? "..." : t("log_out")}
                </span>
              </button>
            </div>
          )}

          {view === "appearance" && (
            <div className="flex flex-col gap-4 p-3">
              {/* Header with back button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setView("main")}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-text/5"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5 text-text" />
                </button>
                <h2 className="text-lg font-semibold text-text">
                  {t("appearance")}
                </h2>
              </div>

              {/* Theme Selector */}
              <ThemeSelector />
            </div>
          )}

          {view === "language" && (
            <div className="flex flex-col gap-4 p-3">
              {/* Header with back button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setView("main")}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-text/5"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5 text-text" />
                </button>
                <h2 className="text-lg font-semibold text-text">
                  {t("language")}
                </h2>
              </div>

              {/* Language Selector */}
              <LanguageSelector />
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
