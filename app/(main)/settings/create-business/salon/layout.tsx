"use client";

import type { ReactNode } from "react";
import { SalonWizardProvider } from "../_lib/salon-wizard-context";

interface SalonWizardLayoutProps {
  children: ReactNode;
}

export default function SalonWizardLayout({ children }: SalonWizardLayoutProps) {
  return <SalonWizardProvider>{children}</SalonWizardProvider>;
}
