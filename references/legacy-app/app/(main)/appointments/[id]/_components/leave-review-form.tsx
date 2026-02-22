"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/lib/ui/button";
import { Field } from "@/lib/ui/field";
import { InteractiveStarRating } from "@/lib/ui/interactive-star-rating";
import { Paper } from "@/lib/ui/paper";
import { Textarea } from "@/lib/ui/textarea";
import { submitReview } from "../../_actions/review.actions";

// ============================================================================
// Types
// ============================================================================

interface LeaveReviewFormProps {
  appointmentId: string;
  /** Called when review is successfully submitted */
  onSuccess?: () => void;
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

export function LeaveReviewForm({
  appointmentId,
  onSuccess,
}: LeaveReviewFormProps) {
  const t = useTranslations("appointments");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const reviewSchema = createReviewSchema((key) => t(key));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const currentRating = watch("rating");

  function onSubmit(data: ReviewFormData) {
    setServerError(null);

    startTransition(async () => {
      const result = await submitReview(
        appointmentId,
        data.rating,
        data.comment || undefined,
      );

      if (result.success) {
        router.refresh();
        onSuccess?.();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <Paper className="p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={isPending}
        >
          {t("submit_review")}
        </Button>
      </form>
    </Paper>
  );
}
