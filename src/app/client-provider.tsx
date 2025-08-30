"use client";

import { LeadsProvider } from "@/context/LeadsContext";
import { Toaster } from "@/components/ui/toaster";
import { type ReactNode } from "react";

export function ClientProvider({ children }: { children: ReactNode }) {
  return (
    <LeadsProvider>
      {children}
      <Toaster />
    </LeadsProvider>
  );
}
