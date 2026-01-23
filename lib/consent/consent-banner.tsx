"use client";

import { useConsentManager } from "@c15t/react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/lib/ui/button";
import { Switch } from "@/lib/ui/switch";
import { cn } from "@/lib/utils/cn";

/**
 * Maps c15t consent names to translation keys.
 */
const CONSENT_TRANSLATION_KEYS: Record<string, string> = {
  necessary: "necessary",
  measurement: "analytics",
  marketing: "marketing",
  functionality: "functionality",
  experience: "experience",
};

interface ConsentCategoryProps {
  name: string;
  checked: boolean;
  disabled?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (checked: boolean) => void;
}

function ConsentCategory({
  name,
  checked,
  disabled,
  isExpanded,
  onToggle,
  onChange,
}: ConsentCategoryProps) {
  const t = useTranslations("consent");

  const translationKey = CONSENT_TRANSLATION_KEYS[name] ?? name;
  const title = t(`categories.${translationKey}.title`);
  const description = t(`categories.${translationKey}.description`);

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </button>

        <span className="flex-1 text-sm font-medium text-foreground">
          {title}
        </span>

        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3 py-2">
              <p className="text-xs text-muted">{description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Custom cookie consent banner built with Base UI components.
 *
 * Features:
 * - Expandable design: starts compact, expands to show category toggles
 * - Blocking overlay that prevents site interaction until consent is given
 * - Left-aligned positioning (bottom-left on desktop)
 * - Horizontal buttons on desktop, vertical on mobile
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const {
    showPopup,
    saveConsents,
    selectedConsents,
    setSelectedConsent,
    gdprTypes,
  } = useConsentManager();

  // Prevent hydration mismatch: only render after client mount
  // The showPopup state depends on cookies/localStorage which aren't available on server
  useEffect(() => {
    setMounted(true);
  }, []);

  function handleAcceptAll() {
    saveConsents("all");
  }

  function handleRejectAll() {
    saveConsents("necessary");
  }

  function handleSaveSettings() {
    saveConsents("custom");
  }

  function handleCustomize() {
    setIsExpanded(true);
  }

  // Filter to only show enabled consent types
  const displayedConsents = gdprTypes.filter(
    (type) => type in CONSENT_TRANSLATION_KEYS,
  );

  // Don't render anything on server to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Blocking overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            aria-hidden="true"
          />

          {/*
            Banner with responsive behavior:
            - Mobile: bottom sheet (full width, no gap, rounded top only, slides up)
            - Desktop: bottom-left card (fixed width, padding, fully rounded, slides from left)
          */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 md:inset-x-auto md:left-0 md:p-6"
          >
            <div
              className={cn(
                "w-full bg-surface shadow-lg",
                // Mobile: bottom sheet style
                "rounded-t-2xl",
                // Desktop: card style with full rounding
                "md:w-[420px] md:rounded-2xl md:border md:border-border",
              )}
            >
              {/* Header */}
              <div className="p-4 pb-0">
                <h2 className="text-base font-semibold text-foreground">
                  {t("banner.title")}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {isExpanded
                    ? t("dialog.description")
                    : t("banner.description")}
                </p>
              </div>

              {/* Content area */}
              <div className="px-4">
                {/* Expanded: show category toggles */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mt-3 space-y-2 pb-1">
                        {displayedConsents.map((consentName) => {
                          const isNecessary = consentName === "necessary";
                          const isChecked = isNecessary
                            ? true
                            : Boolean(selectedConsents[consentName]);

                          return (
                            <ConsentCategory
                              key={consentName}
                              name={consentName}
                              checked={isChecked}
                              disabled={isNecessary}
                              isExpanded={expandedCategory === consentName}
                              onToggle={() =>
                                setExpandedCategory(
                                  expandedCategory === consentName
                                    ? null
                                    : consentName,
                                )
                              }
                              onChange={(checked) =>
                                setSelectedConsent(consentName, checked)
                              }
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div
                className={cn(
                  "p-4 pt-3",
                  "flex gap-2",
                  isExpanded
                    ? "flex-col"
                    : "flex-col sm:flex-row sm:items-center",
                )}
              >
                {isExpanded ? (
                  <>
                    <Button onClick={handleRejectAll} variant="outline">
                      {t("dialog.rejectAll")}
                    </Button>
                    <Button onClick={handleAcceptAll} variant="outline">
                      {t("dialog.acceptAll")}
                    </Button>
                    <Button onClick={handleSaveSettings}>
                      {t("dialog.saveSettings")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleAcceptAll} className="flex-1">
                      {t("banner.acceptAll")}
                    </Button>
                    <Button
                      onClick={handleRejectAll}
                      variant="outline"
                      className="flex-1"
                    >
                      {t("banner.rejectAll")}
                    </Button>
                    <Button
                      onClick={handleCustomize}
                      variant="outline"
                      className="flex-1"
                    >
                      {t("banner.customize")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
