// src/components/App.tsx
import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./dashboard/DashboardLayout";
import { ErrorBoundary } from "./ErrorBoundary";
import { Loader2 } from "lucide-react";
import * as Dashboard from "./dashboard";
import { Toaster } from "./ui/Toast";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <DashboardLayout>
          <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin" />}>
            <Routes>
              <Route path="/" element={<Dashboard.Dashboard />} />
              <Route path="/dashboard">
                <Route index element={<Dashboard.Dashboard />} />
                <Route
                  path="business-profile"
                  element={<Dashboard.BusinessProfile />}
                />
                <Route
                  path="business-services"
                  element={<Dashboard.BusinessServices />}
                />
                <Route
                  path="service-areas"
                  element={<Dashboard.ServiceAreas />}
                />
                <Route
                  path="websites"
                  element={<Dashboard.WebsiteManagement />}
                />
                <Route
                  path="url-generation"
                  element={<Dashboard.URLGeneration />}
                />
                <Route
                  path="prompts"
                  element={<Dashboard.PromptsManagement />}
                />
                <Route
                  path="keywords"
                  element={<Dashboard.KeywordsManagement />}
                />
                <Route path="billing" element={<Dashboard.Billing />} />
                <Route
                  path="page-content-generation"
                  element={<Dashboard.PageGeneration />}
                />
                <Route
                  path="local-seo-photos"
                  element={<Dashboard.LocalSEOPhotos />}
                />
              </Route>
            </Routes>
          </Suspense>
        </DashboardLayout>
      </ErrorBoundary>
      <Toaster />
    </BrowserRouter>
  );
};

export default App;
