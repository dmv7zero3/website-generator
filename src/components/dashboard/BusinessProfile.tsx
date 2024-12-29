import { useState, useEffect, useCallback } from "react";
import {
  ApiService,
  type BusinessProfile as IBusinessProfile,
} from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/UseToast";
import { useBusiness } from "@/contexts/BusinessContext";
import { DynamoDBAttribute } from "@/types/index"; // Add this import
import LocalSEOPhotos from "@/components/dashboard/LocalSEOPhotos";

interface DynamoDBProfile {
  PK: { S: string };
  SK: { S: string };
  name: { S: string };
  website: { S: string };
  industry: { S: string };
  location: {
    M: {
      addressLine1: { S: string };
      addressLine2: { S: string };
      city: { S: string };
      state: { S: string };
      zipCode: { S: string };
    };
  };
  description: {
    M: {
      audience: { S: string };
      history: { S: string };
    };
  };
  metadata: {
    M: {
      createdAt: { S: string };
      updatedAt: { S: string };
      version: { N: string };
    };
  };
  prompts: {
    L: Array<{
      M: {
        category: { S: string };
        content: { S: string };
        id: { S: string };
        isActive: { BOOL: boolean };
        title: { S: string };
        metadata?: {
          M: {
            updatedAt: { S: string };
          };
        };
      };
    }>;
  };
  seoKeywords: {
    L: Array<{ S: string }>;
  };
  serviceAreas: {
    L: Array<{
      M: {
        city: { S: string };
        state: { S: string };
      };
    }>;
  };
  seoWebsites: {
    M: {
      [key: string]: {
        M: {
          id: { S: string };
          isActive: { BOOL: boolean };
          name: { S: string };
        };
      };
    };
  };
}
// For function getLocationValue
type LocationField =
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "zipCode";
// For function getDescriptionValue
type DescriptionField = "audience" | "history";

function transformDynamoDBToProfile(data: DynamoDBProfile): IBusinessProfile {
  // Helper to handle both DynamoDB and plain object formats
  const getLocationValue = (field: LocationField) => {
    const location = data.location;
    if ("M" in location) {
      return location.M[field]?.S || "";
    } else {
      return (location as any)[field] || "";
    }
  };

  // Helper for description fields
  const getDescriptionValue = (field: DescriptionField) => {
    const description = data.description;
    if ("M" in description) {
      return description.M[field]?.S || "";
    } else {
      return (description as any)[field] || "";
    }
  };

  // Transform service areas to correct object format
  const transformServiceAreas = () => {
    if (Array.isArray(data.serviceAreas)) {
      return data.serviceAreas.map((area) => ({
        city: area.city,
        state: area.state,
      }));
    }
    return (
      data.serviceAreas?.L?.map((area) => ({
        city: area.M.city.S,
        state: area.M.state.S,
      })) || []
    );
  };

  // Transform SEO websites to correct object format
  const transformSeoWebsites = () =>
    Object.entries(data.seoWebsites?.M || {}).map(([url, site]) => ({
      url,
      id: site.M.id?.S ?? "",
      isActive: site.M.isActive?.BOOL ?? false,
      name: site.M.name?.S ?? "",
    }));

  return {
    business_id: data.PK.S.replace("BUS#", ""),
    business_name: data.name.S,
    business_website: data.website.S,
    business_industry: data.industry.S,
    business_address1: getLocationValue("addressLine1"),
    business_address2: getLocationValue("addressLine2"),
    business_city: getLocationValue("city"),
    business_state: getLocationValue("state"),
    business_zip: getLocationValue("zipCode"),
    company_history_description: getDescriptionValue("history"),
    target_audience_description: getDescriptionValue("audience"),
    // Use the transformed service areas
    service_areas: transformServiceAreas(),
    business_services: [],
    seoKeywords: Array.isArray(data.seoKeywords)
      ? data.seoKeywords
      : data.seoKeywords?.L?.map((keyword) => keyword.S) || [],
    seoWebsites: transformSeoWebsites(),
  };
}
export default function BusinessProfile() {
  const { selectedBusiness } = useBusiness();
  const [profile, setProfile] = useState<IBusinessProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadProfile = useCallback(async () => {
    if (!selectedBusiness) return;

    setLoading(true);
    setError(null);

    try {
      console.group("Profile Loading Debug");
      console.log("Selected Business:", selectedBusiness);

      const businessProfile = await ApiService.getBusinessProfile(
        selectedBusiness
      );
      if (businessProfile) {
        console.log("Fetched business profile:", businessProfile);
        setProfile(businessProfile);
      } else {
        throw new Error("Failed to load profile");
      }
      console.groupEnd();
    } catch (error) {
      console.error("Profile Loading Error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load profile";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness, toast]);

  useEffect(() => {
    if (selectedBusiness) {
      loadProfile();
    }
  }, [selectedBusiness, loadProfile]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, field: keyof IBusinessProfile) => {
      setProfile((prev) =>
        prev ? { ...prev, [field]: e.target.value } : null
      );
    },
    []
  );

  const handleTextAreaChange = useCallback(
    (
      e: React.ChangeEvent<HTMLTextAreaElement>,
      field: keyof IBusinessProfile
    ) => {
      setProfile((prev) =>
        prev ? { ...prev, [field]: e.target.value } : null
      );
    },
    []
  );

  const handleSave = async () => {
    if (!profile || !selectedBusiness) return;
    setSaving(true);
    try {
      // Transform profile to DynamoDB format
      const dynamoDBProfile = {
        PK: { S: `BUS#${profile.business_id}` },
        name: { S: profile.business_name },
        website: { S: profile.business_website },
        industry: { S: profile.business_industry },
        location: {
          M: {
            addressLine1: { S: profile.business_address1 },
            addressLine2: { S: profile.business_address2 || "" },
            city: { S: profile.business_city },
            state: { S: profile.business_state },
            zipCode: { S: profile.business_zip },
          },
        },
        description: {
          M: {
            history: { S: profile.company_history_description || "" },
            audience: { S: profile.target_audience_description || "" },
          },
        },
        // Add service areas in correct DynamoDB format
        serviceAreas: {
          L:
            profile.service_areas?.map((area) => ({
              M: {
                city: { S: area.city },
                state: { S: area.state },
              },
            })) || [],
        },
        seoWebsites: {
          M: profile.seoWebsites.reduce((acc, site) => {
            acc[site.url] = {
              M: {
                id: { S: site.id },
                isActive: { BOOL: site.isActive },
                name: { S: site.name },
              },
            };
            return acc;
          }, {} as Record<string, { M: Record<string, DynamoDBAttribute<any>> }>),
        },
      };

      const response = await fetch(
        "https://wcvi65m780.execute-api.us-east-1.amazonaws.com/prod/website-generator/update-business-profile-details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "business-slug": selectedBusiness,
            profile: dynamoDBProfile,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save profile";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 text-red-500 rounded-md bg-red-50">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Business Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your business information and settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadProfile} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={!profile || saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input
                value={profile?.business_name || ""}
                onChange={(e) => handleInputChange(e, "business_name")}
                placeholder="Enter business name"
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                value={profile?.business_website || ""}
                onChange={(e) => handleInputChange(e, "business_website")}
                placeholder="https://www.example.com"
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Input
                value={profile?.business_industry || ""}
                onChange={(e) => handleInputChange(e, "business_industry")}
                placeholder="Enter industry"
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address Line 1</label>
              <Input
                value={profile?.business_address1 || ""}
                onChange={(e) => handleInputChange(e, "business_address1")}
                placeholder="Street address"
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address Line 2</label>
              <Input
                value={profile?.business_address2 || ""}
                onChange={(e) => handleInputChange(e, "business_address2")}
                placeholder="Suite, unit, building (optional)"
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                value={profile?.business_city || ""}
                onChange={(e) => handleInputChange(e, "business_city")}
                placeholder="Enter city"
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Input
                value={profile?.business_state || ""}
                onChange={(e) => handleInputChange(e, "business_state")}
                placeholder="Enter state"
                disabled={loading || saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ZIP Code</label>
              <Input
                value={profile?.business_zip || ""}
                onChange={(e) => handleInputChange(e, "business_zip")}
                placeholder="Enter ZIP code"
                disabled={loading || saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company History</label>
            <textarea
              value={profile?.company_history_description || ""}
              onChange={(e) =>
                handleTextAreaChange(e, "company_history_description")
              }
              placeholder="Describe your company's history and background"
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
              disabled={loading || saving}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Audience</label>
            <textarea
              value={profile?.target_audience_description || ""}
              onChange={(e) =>
                handleTextAreaChange(e, "target_audience_description")
              }
              placeholder="Describe your target audience and customer base"
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
              disabled={loading || saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Local SEO Photos Section */}
      {selectedBusiness && <LocalSEOPhotos />}
    </div>
  );
}
