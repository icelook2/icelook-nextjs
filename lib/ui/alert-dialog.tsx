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
          <BaseAlertDialog.Popup
            render={
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2",
                  "rounded-2xl bg-surface p-6 shadow-xl",
                  "focus:outline-none",
                  className,
                )}
              />
            }
          >
            {children}
          </BaseAlertDialog.Popup>
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
