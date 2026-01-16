"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { ArrowLeft, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// Dialog Root
// ============================================================================

type DialogRootProps = ComponentPropsWithoutRef<typeof BaseDialog.Root>;

function DialogRoot({ children, ...props }: DialogRootProps) {
  return <BaseDialog.Root {...props}>{children}</BaseDialog.Root>;
}

// ============================================================================
// Dialog Trigger
// ============================================================================

type DialogTriggerProps = ComponentPropsWithoutRef<typeof BaseDialog.Trigger>;

function DialogTrigger({ children, ...props }: DialogTriggerProps) {
  return <BaseDialog.Trigger {...props}>{children}</BaseDialog.Trigger>;
}

// ============================================================================
// Dialog Portal with Animations
// ============================================================================

/**
 * Dialog Portal with responsive behavior:
 * - Mobile: iOS-style bottom sheet that slides up from bottom
 * - Desktop (md+): Centered dialog with scale animation
 *
 * Uses portals to render above other content without z-index.
 * Content scrolls internally when it exceeds viewport height.
 */

interface DialogPortalProps {
  children: ReactNode;
  open?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "md:max-w-sm",
  md: "md:max-w-md",
  lg: "md:max-w-lg",
  xl: "md:max-w-xl",
  full: "md:max-w-4xl",
};

function DialogPortal({
  children,
  open,
  className,
  size = "md",
}: DialogPortalProps) {
  return (
    <AnimatePresence>
      {open && (
        <BaseDialog.Portal keepMounted>
          <BaseDialog.Backdrop
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-[2px]"
              />
            }
          />
          {/* Viewport wrapper handles positioning via flexbox */}
          <div
            className={cn(
              "fixed inset-0 flex overflow-hidden",
              // Mobile: align to bottom (sheet style)
              "items-end justify-center",
              // Desktop: center the dialog
              "md:items-center",
            )}
          >
            <BaseDialog.Popup
              render={
                <motion.div
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "100%" }}
                  transition={{
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1], // iOS-like spring curve
                  }}
                  className={cn(
                    // Base styles
                    "w-full shadow-xl",
                    "bg-surface focus:outline-none",
                    "flex max-h-[90dvh] flex-col overflow-hidden",
                    // Mobile: bottom sheet with top rounded corners
                    "rounded-t-2xl",
                    // Desktop: centered with all corners rounded
                    "md:w-[calc(100%-2rem)] md:rounded-2xl",
                    sizeClasses[size],
                    className,
                  )}
                />
              }
            >
              {children}
            </BaseDialog.Popup>
          </div>
        </BaseDialog.Portal>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Dialog Header
// ============================================================================

interface DialogHeaderProps {
  children: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  onBack?: () => void;
  showCloseButton?: boolean;
  showBackButton?: boolean;
  /** Custom action element to show instead of the close button */
  action?: ReactNode;
  className?: string;
}

function DialogHeader({
  children,
  subtitle,
  onClose,
  onBack,
  showCloseButton = true,
  showBackButton = false,
  action,
  className,
}: DialogHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 border-b border-border px-4 py-3",
        className,
      )}
    >
      {/* Back button */}
      {showBackButton && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent-soft/50"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : showBackButton ? (
        <div className="w-10" />
      ) : null}

      {/* Title and subtitle */}
      <div className="min-w-0 flex-1">
        <BaseDialog.Title className="text-lg font-semibold">
          {children}
        </BaseDialog.Title>
        {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
      </div>

      {/* Action or Close button */}
      {action ? (
        action
      ) : showCloseButton ? (
        <BaseDialog.Close
          onClick={onClose}
          className="-mr-1 rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </BaseDialog.Close>
      ) : null}
    </div>
  );
}

// ============================================================================
// Dialog Body
// ============================================================================

interface DialogBodyProps {
  children: ReactNode;
  className?: string;
}

function DialogBody({ children, className }: DialogBodyProps) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto p-6", className)}>
      <BaseDialog.Description render={<div />}>
        {children}
      </BaseDialog.Description>
    </div>
  );
}

// ============================================================================
// Dialog Footer
// ============================================================================

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-t border-border px-6 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Dialog Close (inline)
// ============================================================================

type DialogCloseProps = ComponentPropsWithoutRef<typeof BaseDialog.Close>;

function DialogClose({ children, ...props }: DialogCloseProps) {
  return <BaseDialog.Close {...props}>{children}</BaseDialog.Close>;
}

// ============================================================================
// Export
// ============================================================================

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose,
};
