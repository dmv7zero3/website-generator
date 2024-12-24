// src/components/dashboard/BusinessServices.tsx
import { useState, useEffect } from "react";
import { ApiService } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Plus, X, Loader2 } from "lucide-react";
import { useToast } from "../ui/UseToast";
import { useBusiness } from "@/contexts/BusinessContext";

interface BusinessService {
  name: string;
  description: string;
  price: string;
}

export type { BusinessService };

export function BusinessServices() {
  const { selectedBusiness } = useBusiness();
  const [services, setServices] = useState<BusinessService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedBusiness) {
      loadServices();
    }
  }, [selectedBusiness]);

  const loadServices = async () => {
    try {
      setLoading(true);
      // Add null check
      if (!selectedBusiness) {
        throw new Error("No business selected");
      }
      const profile = await ApiService.getBusinessProfile(selectedBusiness);
      if (profile?.business_services) {
        const formattedServices = formatServicesFromDB(
          profile.business_services
        );
        setServices(formattedServices);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatServicesFromDB = (dbServices: any) => {
    // Format the DB structure into our BusinessService interface
    const services: BusinessService[] = [];
    const serviceCount = Object.keys(dbServices[0].M).filter((k) =>
      k.startsWith("businessservice_name_")
    ).length;

    for (let i = 0; i < serviceCount; i++) {
      services.push({
        name: dbServices[0].M[`businessservice_name_${i}`]?.S || "",
        description:
          dbServices[0].M[`businessservice_description_${i}`]?.S || "",
        price: dbServices[0].M[`businessservice_price_${i}`]?.S || "",
      });
    }
    return services;
  };

  const handleSave = async () => {
    if (!selectedBusiness) return;
    try {
      setSaving(true);
      await ApiService.updateBusinessServices(selectedBusiness, services);
      toast({
        title: "Success",
        description: "Services updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save services",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    setServices([...services, { name: "", description: "", price: "" }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (
    index: number,
    field: keyof BusinessService,
    value: string
  ) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Business Services
          </h1>
          <p className="text-muted-foreground">
            Manage your business service offerings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || services.length === 0}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No services added yet</h3>
                <p className="text-sm text-muted-foreground">
                  Get started by adding your first service
                </p>
                <Button onClick={addService} variant="default" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Service
                </Button>
              </div>
            </div>
          ) : (
            <>
              {services.map((service, index) => (
                <div
                  key={index}
                  className="grid gap-4 p-4 border rounded-lg md:grid-cols-2"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service Name</label>
                    <Input
                      value={service.name}
                      onChange={(e) =>
                        updateService(index, "name", e.target.value)
                      }
                      placeholder="Enter service name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price</label>
                    <div className="flex gap-2">
                      <Input
                        value={service.price}
                        onChange={(e) =>
                          updateService(index, "price", e.target.value)
                        }
                        placeholder="Enter price"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeService(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={service.description}
                      onChange={(e) =>
                        updateService(index, "description", e.target.value)
                      }
                      placeholder="Enter service description"
                      className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                    />
                  </div>
                </div>
              ))}
              <Button onClick={addService} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
