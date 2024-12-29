import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./dashboard/DashboardLayout";
import { ErrorBoundary } from "./ErrorBoundary";
import { Loader2 } from "lucide-react";
import * as Dashboard from "./dashboard";
import { Toaster } from "./ui/Toast";
import { useBusiness } from "@/contexts/BusinessContext";

const App: React.FC = () => {
  const { selectedBusiness } = useBusiness();

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <DashboardLayout>
          <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin" />}>
            <Routes>
              <Route path="/" element={<Dashboard.LocalSEOPhotos />} />
            </Routes>
          </Suspense>
        </DashboardLayout>
      </ErrorBoundary>
      <Toaster />
    </BrowserRouter>
  );
};

export default App;
