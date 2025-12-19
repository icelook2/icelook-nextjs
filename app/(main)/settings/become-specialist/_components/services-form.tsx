"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/lib/ui/button";
import { useWizard } from "../_lib/wizard-context";
import type { Currency, ServiceData } from "../_lib/types";
import { WizardProgress } from "./wizard-progress";
import { ServiceItem } from "./service-item";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function createEmptyService(): ServiceData {
  return {
    id: generateId(),
    name: "",
    price: 0,
    currency: "UAH",
    durationMinutes: 60,
  };
}

interface ServiceState extends Omit<ServiceData, "price"> {
  price: string; // String for input handling
}

export function ServicesForm() {
  const t = useTranslations("specialist.wizard");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const { profileData, services: savedServices, setServices, goToStep } = useWizard();

  // Local state for services (with string prices for input handling)
  const [services, setLocalServices] = useState<ServiceState[]>(() =>
    savedServices.length > 0
      ? savedServices.map((s) => ({ ...s, price: s.price.toString() }))
      : [],
  );

  const [errors, setErrors] = useState<Record<string, { name?: string; price?: string }>>({});

  const addService = useCallback(() => {
    const newService = createEmptyService();
    setLocalServices((prev) => [...prev, { ...newService, price: "" }]);
  }, []);

  const removeService = useCallback((id: string) => {
    setLocalServices((prev) => prev.filter((s) => s.id !== id));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const updateService = useCallback(
    (id: string, field: keyof ServiceState, value: string | number) => {
      setLocalServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
      );
      // Clear error when field is updated
      if (field === "name" || field === "price") {
        setErrors((prev) => ({
          ...prev,
          [id]: { ...prev[id], [field]: undefined },
        }));
      }
    },
    [],
  );

  // Redirect if no profile data
  useEffect(() => {
    if (!profileData) {
      router.push("/settings/become-specialist/profile");
    }
  }, [profileData, router]);

  // Show nothing while redirecting
  if (!profileData) {
    return null;
  }

  function validateServices(): boolean {
    const newErrors: Record<string, { name?: string; price?: string }> = {};
    let isValid = true;

    for (const service of services) {
      const serviceErrors: { name?: string; price?: string } = {};

      if (!service.name.trim()) {
        serviceErrors.name = tValidation("service_name_required");
        isValid = false;
      }

      const priceNum = parseFloat(service.price);
      if (service.price && (isNaN(priceNum) || priceNum < 0)) {
        serviceErrors.price = tValidation("price_invalid");
        isValid = false;
      }

      if (Object.keys(serviceErrors).length > 0) {
        newErrors[service.id] = serviceErrors;
      }
    }

    setErrors(newErrors);
    return isValid;
  }

  function handleNext() {
    if (services.length > 0 && !validateServices()) {
      return;
    }

    // Convert to ServiceData (parse prices)
    const serviceData: ServiceData[] = services.map((s) => ({
      id: s.id,
      name: s.name.trim(),
      price: parseFloat(s.price) || 0,
      currency: s.currency,
      durationMinutes: s.durationMinutes,
    }));

    setServices(serviceData);
    goToStep("contacts");
    router.push("/settings/become-specialist/contacts");
  }

  function handleBack() {
    goToStep("profile");
    router.push("/settings/become-specialist/profile");
  }

  function handleSkip() {
    setServices([]);
    goToStep("contacts");
    router.push("/settings/become-specialist/contacts");
  }

  return (
    <div className="space-y-6">
      <WizardProgress currentStep="services" completedSteps={["profile"]} />

      <div className="space-y-4">
        {/* Services List */}
        {services.length > 0 && (
          <div className="space-y-3">
            {services.map((service, index) => (
              <ServiceItem
                key={service.id}
                index={index}
                name={service.name}
                price={service.price}
                currency={service.currency}
                durationMinutes={service.durationMinutes}
                onNameChange={(value) => updateService(service.id, "name", value)}
                onPriceChange={(value) => updateService(service.id, "price", value)}
                onCurrencyChange={(value) =>
                  updateService(service.id, "currency", value)
                }
                onDurationChange={(value) =>
                  updateService(service.id, "durationMinutes", value)
                }
                onRemove={() => removeService(service.id)}
                errors={errors[service.id]}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">{t("no_services_yet")}</p>
            <p className="mt-1 text-xs text-gray-400">{t("services_optional")}</p>
          </div>
        )}

        {/* Add Service Button */}
        <Button
          type="button"
          variant="secondary"
          onClick={addService}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("add_service")}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button type="button" variant="ghost" onClick={handleBack}>
          {t("back")}
        </Button>

        <div className="flex gap-2">
          {services.length === 0 && (
            <Button type="button" variant="secondary" onClick={handleSkip}>
              {t("skip")}
            </Button>
          )}
          <Button type="button" onClick={handleNext}>
            {t("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
