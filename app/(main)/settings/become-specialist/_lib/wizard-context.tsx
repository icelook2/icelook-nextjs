"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  ContactsData,
  ProfileData,
  ServiceData,
  WizardStep,
} from "./types";

interface WizardContextValue {
  // Current step
  step: WizardStep;

  // Data for each step
  profileData: ProfileData | null;
  services: ServiceData[];
  contactsData: ContactsData | null;

  // Actions
  setProfileData: (data: ProfileData) => void;
  setServices: (services: ServiceData[]) => void;
  setContactsData: (data: ContactsData) => void;
  goToStep: (step: WizardStep) => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

const DEFAULT_CONTACTS: ContactsData = {
  instagram: "",
  phone: "",
  telegram: "",
  viber: "",
  whatsapp: "",
};

interface WizardProviderProps {
  children: ReactNode;
  initialStep?: WizardStep;
}

export function WizardProvider({
  children,
  initialStep = "profile",
}: WizardProviderProps) {
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [contactsData, setContactsData] = useState<ContactsData | null>(null);

  function goToStep(newStep: WizardStep) {
    setStep(newStep);
  }

  function reset() {
    setStep("profile");
    setProfileData(null);
    setServices([]);
    setContactsData(null);
  }

  return (
    <WizardContext.Provider
      value={{
        step,
        profileData,
        services,
        contactsData,
        setProfileData,
        setServices,
        setContactsData,
        goToStep,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }

  return context;
}

export { DEFAULT_CONTACTS };
