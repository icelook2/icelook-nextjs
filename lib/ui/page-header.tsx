"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useSmartBack } from "@/components/navigation-provider";
import { cn } from "@/lib/utils/cn";

/**
 * PageHeader - Reusable header component for pages
 *
 * The back button uses smart navigation: it will go back in browser history
 * if the user navigated from within the app, otherwise it navigates to the
 * fallback URL specified in backHref.
 *
 * @example
 * // Simple usage with title only (no back button)
 * <PageHeader title="Settings" />
 *
 * @example
 * // With back button - goes back in history or to /beauty-pages as fallback
 * <PageHeader
 *   title="Beauty Page Settings"
 *   subtitle="Roman's Beauty Page"
 *   backHref="/beauty-pages"
 * />
 *
 * @example
 * // With custom title rendering
 * <PageHeader
 *   title={<h1 className="text-2xl font-bold">Custom Title</h1>}
 *   subtitle={<span className="text-blue-500">Custom subtitle</span>}
 * />
 *
 * @example
 * // With actions on the right
 * <PageHeader
 *   title="Profile"
 *   backHref="/settings"
 * >
 *   <Button>Edit</Button>
 * </PageHeader>
 *
 * @example
 * // With max-width container
 * <PageHeader
 *   title="Settings"
 *   containerClassName="mx-auto max-w-2xl"
 * />
 */

interface PageHeaderProps {
  /** Main title - can be string or ReactNode for custom rendering */
  title: ReactNode;
  /** Subtitle/description - can be string or ReactNode for flexibility */
  subtitle?: ReactNode;
  /**
   * Fallback URL for back navigation. If provided, shows a back button.
   * The button will navigate back in history if possible, otherwise go to this URL.
   */
  backHref?: string;
  /** Optional actions/buttons on the right side */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Container class names (for padding, max-width, etc) */
  containerClassName?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  children,
  className,
  containerClassName,
}: PageHeaderProps) {
  // Use "/" as default fallback if backHref is empty string (for backwards compatibility)
  const handleBack = useSmartBack(backHref || "/");

  return (
    <header className={cn("bg-background", className)}>
      <div className={cn("px-4", containerClassName)}>
        <div className="flex items-center gap-3">
          {backHref !== undefined && (
            <button
              type="button"
              onClick={handleBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent-soft/50"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {typeof title === "string" ? (
              <h1 className="text-lg font-semibold">{title}</h1>
            ) : (
              title
            )}
            {subtitle && (
              <div className="mt-0.5">
                {typeof subtitle === "string" ? (
                  <p className="text-sm text-muted">{subtitle}</p>
                ) : (
                  subtitle
                )}
              </div>
            )}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </header>
  );
}
