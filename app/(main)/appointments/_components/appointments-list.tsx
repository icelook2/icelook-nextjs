"use client";

import { Calendar, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ClientAppointment } from "@/lib/queries/appointments";
import { Button } from "@/lib/ui/button";
import { loadMorePastAppointments } from "../_actions";
import { AppointmentCard } from "./appointment-card";
import { LeaveReviewDialog } from "./leave-review-dialog";

interface AppointmentsListProps {
  upcoming: ClientAppointment[];
  initialPast: ClientAppointment[];
  initialHasMore: boolean;
  /** When true, shows a flat list without sections (for date filtering) */
  isFiltered?: boolean;
}

export function AppointmentsList({
  upcoming,
  initialPast,
  initialHasMore,
  isFiltered = false,
}: AppointmentsListProps) {
  const t = useTranslations("appointments");

  // State for past appointments pagination
  const [pastAppointments, setPastAppointments] =
    useState<ClientAppointment[]>(initialPast);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, startLoadingMore] = useTransition();

  // State for leave review dialog
  const [reviewingAppointment, setReviewingAppointment] =
    useState<ClientAppointment | null>(null);

  const hasNoAppointments =
    upcoming.length === 0 && pastAppointments.length === 0;

  function handleLoadMore() {
    startLoadingMore(async () => {
      const result = await loadMorePastAppointments(pastAppointments.length);
      if (result.success) {
        setPastAppointments((prev) => [...prev, ...result.results]);
        setHasMore(result.hasMore);
      }
    });
  }

  function handleLeaveReview(appointment: ClientAppointment) {
    setReviewingAppointment(appointment);
  }

  function handleCloseReviewDialog() {
    setReviewingAppointment(null);
  }

  function handleReviewSuccess(appointmentId: string, rating: number) {
    // Update the appointment in local state to show the review immediately
    setPastAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? {
              ...apt,
              hasReview: true,
              review: {
                id: crypto.randomUUID(),
                rating,
                comment: null,
                created_at: new Date().toISOString(),
              },
            }
          : apt,
      ),
    );
  }

  // Empty state - different message for filtered vs unfiltered
  if (hasNoAppointments) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Calendar className="h-6 w-6 text-accent" />
        </div>
        {isFiltered ? (
          <>
            <p className="font-medium">{t("no_appointments_for_date")}</p>
            <p className="text-sm text-muted">{t("try_another_date")}</p>
          </>
        ) : (
          <>
            <p className="font-medium">{t("no_appointments")}</p>
            <p className="text-sm text-muted">{t("book_first")}</p>
            <Link href="/search" className="mt-4 inline-block">
              <Button size="sm">{t("find_specialists")}</Button>
            </Link>
          </>
        )}
      </div>
    );
  }

  // Filtered view - flat list without sections
  if (isFiltered) {
    return (
      <>
        <div className="flex flex-col gap-4">
          {upcoming.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onLeaveReview={handleLeaveReview}
            />
          ))}
        </div>

        {/* Leave Review Dialog */}
        <LeaveReviewDialog
          appointment={reviewingAppointment}
          onClose={handleCloseReviewDialog}
          onSuccess={handleReviewSuccess}
        />
      </>
    );
  }

  // Default view - split into upcoming and past sections
  return (
    <>
      <div className="space-y-8">
        {/* Upcoming Section */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t("upcoming")}
            </h2>
            <div className="flex flex-col gap-4">
              {upcoming.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onLeaveReview={handleLeaveReview}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past Section */}
        {(pastAppointments.length > 0 || initialPast.length > 0) && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t("past")}
            </h2>

            {pastAppointments.length > 0 ? (
              <div className="flex flex-col gap-4">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onLeaveReview={handleLeaveReview}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
                <p className="text-sm text-muted">{t("no_past")}</p>
              </div>
            )}

            {/* Load More Button */}
            {pastAppointments.length > 0 && (
              <div className="flex justify-center pt-4">
                {hasMore ? (
                  <Button
                    variant="soft"
                    size="icon"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                ) : (
                  <p className="text-sm text-muted">{t("end_of_list")}</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Leave Review Dialog */}
      <LeaveReviewDialog
        appointment={reviewingAppointment}
        onClose={handleCloseReviewDialog}
        onSuccess={handleReviewSuccess}
      />
    </>
  );
}
