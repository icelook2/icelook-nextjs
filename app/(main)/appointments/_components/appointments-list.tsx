"use client";

import { Calendar, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { CurrentUserProfile } from "@/app/[nickname]/_components/booking/_lib/booking-types";
import type { ClientAppointment } from "@/lib/queries/appointments";
import { Button } from "@/lib/ui/button";
import { loadMorePastAppointments } from "../_actions";
import { AppointmentCard } from "./appointment-card";
import {
  QuickBookingDialog,
  type QuickBookingTranslations,
} from "./quick-booking-dialog";

interface AppointmentsListProps {
  upcoming: ClientAppointment[];
  initialPast: ClientAppointment[];
  initialHasMore: boolean;
  /** Current user info for rebooking */
  currentUserId?: string;
  currentUserProfile?: CurrentUserProfile;
  /** Translations for quick booking dialog */
  quickBookingTranslations: QuickBookingTranslations;
  /** When true, shows a flat list without sections (for date filtering) */
  isFiltered?: boolean;
}

export function AppointmentsList({
  upcoming,
  initialPast,
  initialHasMore,
  currentUserId,
  currentUserProfile,
  quickBookingTranslations,
  isFiltered = false,
}: AppointmentsListProps) {
  const t = useTranslations("appointments");

  // State for past appointments pagination
  const [pastAppointments, setPastAppointments] =
    useState<ClientAppointment[]>(initialPast);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, startLoadingMore] = useTransition();

  // State for quick booking dialog
  const [rebookingAppointment, setRebookingAppointment] =
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

  function handleBookAgain(appointment: ClientAppointment) {
    setRebookingAppointment(appointment);
  }

  function handleCloseBookingDialog() {
    setRebookingAppointment(null);
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
              onBookAgain={handleBookAgain}
            />
          ))}
        </div>

        {/* Quick Booking Dialog */}
        <QuickBookingDialog
          appointment={rebookingAppointment}
          onClose={handleCloseBookingDialog}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          translations={quickBookingTranslations}
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
                  onBookAgain={handleBookAgain}
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
                    onBookAgain={handleBookAgain}
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

      {/* Quick Booking Dialog */}
      <QuickBookingDialog
        appointment={rebookingAppointment}
        onClose={handleCloseBookingDialog}
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
        translations={quickBookingTranslations}
      />
    </>
  );
}
