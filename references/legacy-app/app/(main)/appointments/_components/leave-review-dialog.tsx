"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ClientAppointment } from "@/lib/queries/appointments";
import { Button } from "@/lib/ui/button";
import { Dialog } from "@/lib/ui/dialog";
import { Field } from "@/lib/ui/field";
import { InteractiveStarRating } from "@/lib/ui/interactive-star-rating";
import { Textarea } from "@/lib/ui/textarea";
import { submitReview } from "../_actions/review.actions";

// ============================================================================
// Types
// ============================================================================

interface LeaveReviewDialogProps {
  /** The appointment to review, or null to close the dialog */
  appointment: ClientAppointment | null;
  /** Called when the dialog should close */
  onClose: () => void;
  /** Called when review is successfully submitted with the review data */
  onSuccess?: (appointmentId: string, rating: number) => void;
}

// ============================================================================
// Schema
// ============================================================================

function createReviewSchema(t: (key: string) => string) {
  return z.object({
    rating: z
      .number()
      .min(1, t("rating_required"))
      .max(5, t("rating_required")),
    comment: z.string().max(1000, t("comment_too_long")).optional(),
  });
}

type ReviewFormData = z.infer<ReturnType<typeof createReviewSchema>>;

// ============================================================================
// Component
// ============================================================================

export function LeaveReviewDialog({
  appointment,
  onClose,
  onSuccess,
}: LeaveReviewDialogProps) {
  const t = useTranslations("appointments");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const reviewSchema = createReviewSchema((key) => t(key));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const currentRating = watch("rating");
  const isOpen = appointment !== null;

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Reset state when closing
      setServerError(null);
      setIsSuccess(false);
      reset();
      onClose();
    }
  }

  function onSubmit(data: ReviewFormData) {
    if (!appointment) {
      return;
    }

    setServerError(null);

    startTransition(async () => {
      const result = await submitReview(
        appointment.id,
        data.rating,
        data.comment || undefined,
      );

      if (result.success) {
        setIsSuccess(true);
        router.refresh();
        // Notify parent of success with review data
        onSuccess?.(appointment.id, data.rating);
        // Auto-close after showing success message
        setTimeout(() => {
          handleOpenChange(false);
        }, 1500);
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal open={isOpen} size="sm">
        <Dialog.Header onClose={() => handleOpenChange(false)}>
          {t("leave_review")}
        </Dialog.Header>

        <Dialog.Body className="p-4">
          {isSuccess ? (
            // Success state
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-medium text-foreground">
                {t("review_submitted")}
              </p>
            </div>
          ) : (
            // Form state
            <form
              id="leave-review-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Service name context */}
              {appointment && (
                <p className="text-sm text-muted">{appointment.service_name}</p>
              )}

              {/* Rating */}
              <Field.Root>
                <Field.Label>{t("rate_your_visit")}</Field.Label>
                <InteractiveStarRating
                  value={currentRating}
                  onChange={(rating) => setValue("rating", rating)}
                  size="lg"
                  disabled={isPending}
                />
                <Field.Error>{errors.rating?.message}</Field.Error>
              </Field.Root>

              {/* Comment */}
              <Field.Root>
                <Field.Label>{t("add_comment")}</Field.Label>
                <Textarea
                  {...register("comment")}
                  placeholder={t("comment_placeholder")}
                  rows={3}
                  disabled={isPending}
                  state={errors.comment ? "error" : "default"}
                />
                <Field.Error>{errors.comment?.message}</Field.Error>
              </Field.Root>

              {/* Server error */}
              {serverError && (
                <p className="text-sm text-danger">{serverError}</p>
              )}
            </form>
          )}
        </Dialog.Body>

        {!isSuccess && (
          <Dialog.Footer>
            <Button
              type="submit"
              form="leave-review-form"
              variant="primary"
              className="w-full"
              loading={isPending}
            >
              {t("submit_review")}
            </Button>
          </Dialog.Footer>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
