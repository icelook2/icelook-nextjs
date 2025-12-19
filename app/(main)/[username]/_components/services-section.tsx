"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { BookingSpecialist, BookingService } from "@/lib/appointments";
import { BookingDialog } from "./booking";
import { BookSelectedButton } from "./book-selected-button";
import { ServiceCard } from "./service-card";
import {
  ServiceSelectionProvider,
  useServiceSelection,
} from "./service-selection-context";

interface Service {
  id: string;
  name: string;
  price: number;
  currency: "UAH" | "USD" | "EUR";
  duration_minutes: number;
}

interface ServiceGroup {
  id: string;
  name: string;
  services: Service[];
}

interface ServicesSectionProps {
  serviceGroups: ServiceGroup[];
  specialist: BookingSpecialist;
  isAuthenticated: boolean;
  userName: string | null;
}

export function ServicesSection({
  serviceGroups,
  specialist,
  isAuthenticated,
  userName,
}: ServicesSectionProps) {
  return (
    <ServiceSelectionProvider>
      <ServicesSectionContent
        serviceGroups={serviceGroups}
        specialist={specialist}
        isAuthenticated={isAuthenticated}
        userName={userName}
      />
    </ServiceSelectionProvider>
  );
}

function ServicesSectionContent({
  serviceGroups,
  specialist,
  isAuthenticated,
  userName,
}: ServicesSectionProps) {
  const t = useTranslations("specialist.profile");
  const { selectedServices, isSelected, toggleService, clearSelection } =
    useServiceSelection();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter groups with services
  const groupsWithServices = serviceGroups.filter(
    (group) => group.services.length > 0,
  );

  if (groupsWithServices.length === 0) {
    return null;
  }

  // Calculate total services count
  const totalServices = groupsWithServices.reduce(
    (sum, group) => sum + group.services.length,
    0,
  );

  const handleBook = () => {
    if (selectedServices.length > 0) {
      setIsDialogOpen(true);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    // Clear selection when dialog is closed
    if (!open) {
      clearSelection();
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {t("services_title")} ({totalServices})
        </h2>

        {groupsWithServices.map((group) => (
          <div key={group.id} className="space-y-2">
            {/* Only show group name if not default or if multiple groups */}
            {groupsWithServices.length > 1 && (
              <h3 className="text-sm font-medium text-foreground/70">
                {group.name}
              </h3>
            )}

            <div className="space-y-2">
              {group.services.map((service) => {
                const bookingService: BookingService = {
                  id: service.id,
                  name: service.name,
                  price: service.price,
                  currency: service.currency,
                  duration_minutes: service.duration_minutes,
                };

                return (
                  <ServiceCard
                    key={service.id}
                    service={bookingService}
                    isSelected={isSelected(service.id)}
                    onToggle={() => toggleService(bookingService)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <BookSelectedButton onBook={handleBook} />

      {selectedServices.length > 0 && (
        <BookingDialog
          specialist={specialist}
          services={selectedServices}
          isAuthenticated={isAuthenticated}
          userName={userName}
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
        />
      )}
    </>
  );
}
