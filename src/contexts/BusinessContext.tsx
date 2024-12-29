// src/contexts/BusinessContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ApiService } from "@/lib/api";

interface BusinessContextType {
  selectedBusiness: string;
  setSelectedBusiness: (id: string) => void;
  businesses: Array<{ id: string; name: string }>;
  loading: boolean;
  error: string | null;
  refreshBusinesses: () => Promise<void>;
}

interface BusinessCache {
  timestamp: number;
  data: Array<{ id: string; name: string }>;
}

// Create context with initial values
const BusinessContext = createContext<BusinessContextType>({
  selectedBusiness: "sls-dispensary",
  setSelectedBusiness: () => {},
  businesses: [],
  loading: false,
  error: null,
  refreshBusinesses: async () => {},
});

// Custom hook for using the context
export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
};

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [selectedBusiness, setSelectedBusiness] =
    useState<string>("sls-dispensary");
  const [businesses, setBusinesses] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusinesses = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache if not forcing refresh
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("businessList");
        if (cached) {
          const parsedCache: BusinessCache = JSON.parse(cached);
          // Cache for 1 hour
          if (Date.now() - parsedCache.timestamp < 3600000) {
            setBusinesses(parsedCache.data);
            setLoading(false);
            return;
          }
        }
      }

      const data = await ApiService.getBusinessList();
      if (data && data.length > 0) {
        const transformed = data.map((business) => ({
          id: business.id.replace("BUS#", ""),
          name: business.name,
        }));

        // Update cache
        const cache: BusinessCache = {
          timestamp: Date.now(),
          data: transformed,
        };
        sessionStorage.setItem("businessList", JSON.stringify(cache));

        setBusinesses(transformed);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load businesses"
      );
      console.error("Failed to load businesses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  return (
    <BusinessContext.Provider
      value={{
        selectedBusiness,
        setSelectedBusiness: () => {}, // Disable changing the selected business
        businesses,
        loading,
        error,
        refreshBusinesses: () => loadBusinesses(true),
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}
