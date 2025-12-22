"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * PageHeader - Reusable header component for pages
 *
 * @example
 * // Simple usage with title only
 * <PageHeader title="Settings" />
 *
 * @example
 * // With back button and subtitle
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
 *   backHref=""
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
 /** Back button href - if provided, shows back button. Pass empty string to use router.back() */
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
 const router = useRouter();

 function handleBack() {
 if (backHref) {
 router.push(backHref);
 } else {
 router.back();
 }
 }

 return (
 <header className={cn("bg-background pb-6", className)}>
 <div className={cn("px-4 pt-4", containerClassName)}>
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
