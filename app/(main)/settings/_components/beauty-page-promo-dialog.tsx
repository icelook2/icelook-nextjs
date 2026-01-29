"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { PromoCarousel } from "./promo-carousel";

interface BeautyPagePromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full-screen onboarding dialog explaining what a Beauty Page is.
 * Gradient extends to the top edges of the dialog.
 */
export function BeautyPagePromoDialog({
  open,
  onOpenChange,
}: BeautyPagePromoDialogProps) {
  const router = useRouter();

  const handleComplete = () => {
    onOpenChange(false);
    router.push("/create-beauty-page");
  };

  if (!open) {
    return null;
  }

  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal keepMounted>
        <BaseDialog.Backdrop className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" />
        <div className="fixed inset-0 flex items-end justify-center md:items-center">
          <BaseDialog.Popup className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-xl focus:outline-none md:w-[calc(100%-2rem)] md:max-w-md md:rounded-3xl">
            {/* Content - no padding, gradient extends to edges */}
            <PromoCarousel onComplete={handleComplete} />

            {/* Close button - rendered after content so it stacks on top (no z-index needed) */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-full bg-black/20 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </BaseDialog.Popup>
        </div>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
