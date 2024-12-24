// src/components/dashboard/ServiceAreas.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Input, Button, Badge } from "../ui";
import { useToast } from "../ui/Toast";
import { ApiService } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";

export const ServiceAreas: React.FC = () => {
  const { selectedBusiness } = useBusiness();
  const [serviceAreas, setServiceAreas] = useState<
    { city: string; state: string }[]
  >([]);
  const [newServiceArea, setNewServiceArea] = useState({ city: "", state: "" });
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Memoize filtered service areas
  const filteredServiceAreas = useMemo(
    () =>
      serviceAreas.filter(
        (area) =>
          area.city.toLowerCase().includes(filter.toLowerCase()) ||
          area.state.toLowerCase().includes(filter.toLowerCase())
      ),
    [serviceAreas, filter]
  );

  useEffect(() => {
    const fetchServiceAreas = async () => {
      console.group("ServiceAreas.fetchServiceAreas");
      console.log("Selected business:", selectedBusiness);

      if (!selectedBusiness) {
        console.log("No business selected");
        console.groupEnd();
        return;
      }

      setIsLoading(true);
      try {
        console.log("Fetching service areas...");
        const areas = await ApiService.getServiceAreas(selectedBusiness);
        console.log("Fetched service areas:", areas);
        setServiceAreas(areas);
      } catch (error) {
        console.error("Fetch service areas error:", error);
        toast({
          title: "Error",
          description: "Failed to load service areas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    };

    fetchServiceAreas();
  }, [selectedBusiness]);

  const handleAddServiceArea = async () => {
    const { city, state } = newServiceArea;
    if (!city || !state) {
      toast({
        title: "Error",
        description: "City and State are required",
        variant: "destructive",
      });
      return;
    }

    const formattedCity = city;
    const formattedState = state;

    if (
      serviceAreas.some(
        (area) => area.city === formattedCity && area.state === formattedState
      )
    ) {
      toast({
        title: "Error",
        description: "Service area already exists",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedBusiness) {
        await ApiService.addServiceArea(selectedBusiness, {
          city: formattedCity,
          state: formattedState,
        });
        setServiceAreas([
          ...serviceAreas,
          { city: formattedCity, state: formattedState },
        ]);
        setNewServiceArea({ city: "", state: "" });
        toast({
          title: "Success",
          description: "Service area added successfully",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add service area",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveServiceArea = async (city: string, state: string) => {
    setIsSaving(true);
    try {
      if (selectedBusiness) {
        await ApiService.deleteServiceArea(selectedBusiness, { city, state });
        setServiceAreas(
          serviceAreas.filter(
            (area) => area.city !== city || area.state !== state
          )
        );
        toast({
          title: "Success",
          description: "Service area removed successfully",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove service area",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="City"
          value={newServiceArea.city}
          onChange={(e) =>
            setNewServiceArea({ ...newServiceArea, city: e.target.value })
          }
          disabled={isSaving}
        />
        <Input
          placeholder="State"
          value={newServiceArea.state}
          onChange={(e) =>
            setNewServiceArea({ ...newServiceArea, state: e.target.value })
          }
          disabled={isSaving}
        />
        <Button
          onClick={handleAddServiceArea}
          disabled={
            !newServiceArea.city.trim() ||
            !newServiceArea.state.trim() ||
            isSaving
          }
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            "Add"
          )}
        </Button>
      </div>

      <Input
        placeholder="Filter service areas..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        disabled={isSaving}
      />

      <div className="flex flex-wrap gap-2">
        {filteredServiceAreas.map((area) => (
          <Badge
            key={`${area.city}-${area.state}`}
            variant="secondary"
            className="px-3 py-1"
          >
            {area.city}, {area.state}
            <button
              className="ml-2 hover:text-red-500"
              onClick={() => handleRemoveServiceArea(area.city, area.state)}
              disabled={isSaving}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {serviceAreas.length} service areas
        </span>
      </div>
    </div>
  );
};
