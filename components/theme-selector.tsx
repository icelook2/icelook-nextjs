"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-2 rounded-full bg-surface-container p-1">
        <div className="h-12 flex-1 rounded-full" />
        <div className="h-12 flex-1 rounded-full" />
        <div className="h-12 flex-1 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 rounded-full bg-surface-container p-1">
      {/* Light */}
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 transition-all",
          theme === "light"
            ? "bg-surface text-on-surface shadow-md border border-border"
            : "text-on-surface-variant hover:bg-surface/50 hover:text-on-surface",
        )}
      >
        <Sun className="h-5 w-5" />
        <span className="text-sm font-medium">{t("light")}</span>
      </button>

      {/* Dark */}
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 transition-all",
          theme === "dark"
            ? "bg-surface text-on-surface shadow-md border border-border"
            : "text-on-surface-variant hover:bg-surface/50 hover:text-on-surface",
        )}
      >
        <Moon className="h-5 w-5" />
        <span className="text-sm font-medium">{t("dark")}</span>
      </button>

      {/* System */}
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={cn(
          "flex flex-1 items-center justify-center rounded-full px-6 py-3 transition-all",
          theme === "system"
            ? "bg-surface text-on-surface shadow-md border border-border"
            : "text-on-surface-variant hover:bg-surface/50 hover:text-on-surface",
        )}
      >
        <span className="text-sm font-medium">{t("system")}</span>
      </button>
    </div>
  );
}
