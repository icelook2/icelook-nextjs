"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  SalonWizardStep,
  SalonProfileData,
  SalonAddressData,
  ContactsData,
} from "./types";
import { DEFAULT_CONTACTS, DEFAULT_ADDRESS } from "./types";

interface SalonWizardContextValue {
  step: SalonWizardStep;
  profileData: SalonProfileData | null;
  addressData: SalonAddressData;
  contactsData: ContactsData;
  organizationId: string | null;

  setProfileData: (data: SalonProfileData) => void;
  setAddressData: (data: SalonAddressData) => void;
  setContactsData: (data: ContactsData) => void;
  setOrganizationId: (id: string | null) => void;
  goToStep: (step: SalonWizardStep) => void;
  reset: () => void;
}

const SalonWizardContext = createContext<SalonWizardContextValue | null>(null);

interface SalonWizardProviderProps {
  children: ReactNode;
  initialStep?: SalonWizardStep;
  organizationId?: string | null;
}

export function SalonWizardProvider({
  children,
  initialStep = "profile",
  organizationId: initialOrgId = null,
}: SalonWizardProviderProps) {
  const [step, setStep] = useState<SalonWizardStep>(initialStep);
  const [profileData, setProfileData] = useState<SalonProfileData | null>(null);
  const [addressData, setAddressData] =
    useState<SalonAddressData>(DEFAULT_ADDRESS);
  const [contactsData, setContactsData] =
    useState<ContactsData>(DEFAULT_CONTACTS);
  const [organizationId, setOrganizationId] = useState<string | null>(
    initialOrgId,
  );

  function goToStep(newStep: SalonWizardStep) {
    setStep(newStep);
  }

  function reset() {
    setStep("profile");
    setProfileData(null);
    setAddressData(DEFAULT_ADDRESS);
    setContactsData(DEFAULT_CONTACTS);
    setOrganizationId(null);
  }

  return (
    <SalonWizardContext.Provider
      value={{
        step,
        profileData,
        addressData,
        contactsData,
        organizationId,
        setProfileData,
        setAddressData,
        setContactsData,
        setOrganizationId,
        goToStep,
        reset,
      }}
    >
      {children}
    </SalonWizardContext.Provider>
  );
}

export function useSalonWizard() {
  const context = useContext(SalonWizardContext);

  if (!context) {
    throw new Error(
      "useSalonWizard must be used within a SalonWizardProvider",
    );
  }

  return context;
}
