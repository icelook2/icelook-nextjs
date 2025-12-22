"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
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

interface DialogPortalProps {
 children: ReactNode;
 open?: boolean;
 className?: string;
 size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
 sm: "max-w-sm",
 md: "max-w-md",
 lg: "max-w-lg",
 xl: "max-w-xl",
 full: "max-w-4xl",
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
 className="fixed inset-0 z-50 backdrop-blur-[2px]"
 />
 }
 />
 <BaseDialog.Popup
 render={
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 8 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 8 }}
 transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
 className={cn(
 "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-xl",
 "focus:outline-none overflow-hidden",
 sizeClasses[size],
 className,
 )}
 />
 }
 >
 {children}
 </BaseDialog.Popup>
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
 onClose?: () => void;
 showCloseButton?: boolean;
 className?: string;
}

function DialogHeader({
 children,
 onClose,
 showCloseButton = true,
 className,
}: DialogHeaderProps) {
 return (
 <div
 className={cn(
 "border-b px-6 py-4 flex items-center justify-between",
 className,
 )}
 >
 <BaseDialog.Title className="text-lg font-semibold">
 {children}
 </BaseDialog.Title>
 {showCloseButton && (
 <BaseDialog.Close
 onClick={onClose}
 className="transition-colors p-1 -mr-1 rounded-lg"
 >
 <X className="h-5 w-5" />
 </BaseDialog.Close>
 )}
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
 <div className={cn("p-6", className)}>
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
 "border-t px-6 py-4 flex items-center gap-2",
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
