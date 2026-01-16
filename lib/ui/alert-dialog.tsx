"use client";

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================================================
// AlertDialog Root
// ============================================================================

type AlertDialogRootProps = ComponentPropsWithoutRef<
  typeof BaseAlertDialog.Root
>;

function AlertDialogRoot({ children, ...props }: AlertDialogRootProps) {
  return <BaseAlertDialog.Root {...props}>{children}</BaseAlertDialog.Root>;
}

// ============================================================================
// AlertDialog Trigger
// ============================================================================

type AlertDialogTriggerProps = ComponentPropsWithoutRef<
  typeof BaseAlertDialog.Trigger
>;

function AlertDialogTrigger({ children, ...props }: AlertDialogTriggerProps) {
  return (
    <BaseAlertDialog.Trigger {...props}>{children}</BaseAlertDialog.Trigger>
  );
}

// ============================================================================
// AlertDialog Portal with Animations
// ============================================================================

interface AlertDialogPortalProps {
  children: ReactNode;
  open?: boolean;
  className?: string;
}

/**
 * AlertDialog Portal with responsive behavior:
 * - Mobile: iOS-style bottom sheet that slides up from bottom
 * - Desktop (md+): Centered dialog with slide animation
 *
 * Uses portals to render above other content without z-index.
 */
function AlertDialogPortal({
  children,
  open,
  className,
}: AlertDialogPortalProps) {
  return (
    <AnimatePresence>
      {open && (
        <BaseAlertDialog.Portal keepMounted>
          <BaseAlertDialog.Backdrop
            render={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
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
            <BaseAlertDialog.Popup
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
                    "w-full max-w-sm shadow-xl",
                    "bg-surface",
                    "focus:outline-none",
                    // Mobile: bottom sheet with top rounded corners, adjusted padding for handle
                    "rounded-t-2xl px-6 pb-6 pt-2",
                    // Desktop: centered with all corners rounded, uniform padding
                    "md:w-[calc(100%-2rem)] md:rounded-2xl md:p-6",
                    className,
                  )}
                />
              }
            >
              {/* iOS-style drag handle - only visible on mobile */}
              <div className="mb-3 flex shrink-0 items-center justify-center pt-1 md:hidden">
                <div className="h-1 w-10 rounded-full bg-muted/40" />
              </div>
              {children}
            </BaseAlertDialog.Popup>
          </div>
        </BaseAlertDialog.Portal>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// AlertDialog Title
// ============================================================================

interface AlertDialogTitleProps {
  children: ReactNode;
  className?: string;
}

function AlertDialogTitle({ children, className }: AlertDialogTitleProps) {
  return (
    <BaseAlertDialog.Title className={cn("text-lg font-semibold", className)}>
      {children}
    </BaseAlertDialog.Title>
  );
}

// ============================================================================
// AlertDialog Description
// ============================================================================

interface AlertDialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

function AlertDialogDescription({
  children,
  className,
}: AlertDialogDescriptionProps) {
  return (
    <BaseAlertDialog.Description
      className={cn("mt-2 text-sm text-muted", className)}
    >
      {children}
    </BaseAlertDialog.Description>
  );
}

// ============================================================================
// AlertDialog Actions
// ============================================================================

interface AlertDialogActionsProps {
  children: ReactNode;
  className?: string;
}

function AlertDialogActions({ children, className }: AlertDialogActionsProps) {
  return (
    <div className={cn("mt-6 flex items-center justify-end gap-2", className)}>
      {children}
    </div>
  );
}

// ============================================================================
// AlertDialog Close
// ============================================================================

type AlertDialogCloseProps = ComponentPropsWithoutRef<
  typeof BaseAlertDialog.Close
>;

function AlertDialogClose({ children, ...props }: AlertDialogCloseProps) {
  return <BaseAlertDialog.Close {...props}>{children}</BaseAlertDialog.Close>;
}

// ============================================================================
// Export
// ============================================================================

export const AlertDialog = {
  Root: AlertDialogRoot,
  Trigger: AlertDialogTrigger,
  Portal: AlertDialogPortal,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Actions: AlertDialogActions,
  Close: AlertDialogClose,
};
