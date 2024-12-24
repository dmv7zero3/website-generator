// src/components/dashboard/DashboardLayout.tsx
import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BusinessProvider } from "@/contexts/BusinessContext";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-[calc(100vh-4rem)]">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </BusinessProvider>
  );
}
