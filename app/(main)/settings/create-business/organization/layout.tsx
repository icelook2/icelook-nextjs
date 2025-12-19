"use client";

import type { ReactNode } from "react";
import { OrganizationWizardProvider } from "../_lib/organization-wizard-context";

interface OrganizationWizardLayoutProps {
  children: ReactNode;
}

export default function OrganizationWizardLayout({
  children,
}: OrganizationWizardLayoutProps) {
  return <OrganizationWizardProvider>{children}</OrganizationWizardProvider>;
}
