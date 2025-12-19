"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  OrganizationWizardStep,
  OrganizationProfileData,
  ContactsData,
} from "./types";
import { DEFAULT_CONTACTS } from "./types";

interface OrganizationWizardContextValue {
  step: OrganizationWizardStep;
  profileData: OrganizationProfileData | null;
  contactsData: ContactsData;

  setProfileData: (data: OrganizationProfileData) => void;
  setContactsData: (data: ContactsData) => void;
  goToStep: (step: OrganizationWizardStep) => void;
  reset: () => void;
}

const OrganizationWizardContext =
  createContext<OrganizationWizardContextValue | null>(null);

interface OrganizationWizardProviderProps {
  children: ReactNode;
  initialStep?: OrganizationWizardStep;
}

export function OrganizationWizardProvider({
  children,
  initialStep = "profile",
}: OrganizationWizardProviderProps) {
  const [step, setStep] = useState<OrganizationWizardStep>(initialStep);
  const [profileData, setProfileData] =
    useState<OrganizationProfileData | null>(null);
  const [contactsData, setContactsData] =
    useState<ContactsData>(DEFAULT_CONTACTS);

  function goToStep(newStep: OrganizationWizardStep) {
    setStep(newStep);
  }

  function reset() {
    setStep("profile");
    setProfileData(null);
    setContactsData(DEFAULT_CONTACTS);
  }

  return (
    <OrganizationWizardContext.Provider
      value={{
        step,
        profileData,
        contactsData,
        setProfileData,
        setContactsData,
        goToStep,
        reset,
      }}
    >
      {children}
    </OrganizationWizardContext.Provider>
  );
}

export function useOrganizationWizard() {
  const context = useContext(OrganizationWizardContext);

  if (!context) {
    throw new Error(
      "useOrganizationWizard must be used within an OrganizationWizardProvider",
    );
  }

  return context;
}
