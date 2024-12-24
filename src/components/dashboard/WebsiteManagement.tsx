import React, { useState, useEffect } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "@/components/ui/UseToast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Globe,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Info,
} from "lucide-react";

interface Website {
  url: string;
  id: string;
  name: string;
  isActive: boolean;
}

const API_URL =
  "https://wcvi65m780.execute-api.us-east-1.amazonaws.com/prod/website-generator";

export function WebsiteManagement() {
  const { selectedBusiness } = useBusiness();
  const [seoWebsites, setSeoWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingWebsite, setUpdatingWebsite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sort websites to show active first and then alphabetically by name
  const sortedWebsites = [...seoWebsites].sort((a, b) => {
    if (a.isActive === b.isActive) {
      return a.name.localeCompare(b.name);
    }
    return a.isActive ? -1 : 1;
  });

  const loadWebsites = async () => {
    try {
      if (!selectedBusiness) return;

      const response = await fetch(`${API_URL}/get-seo-websites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "business-slug": selectedBusiness }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      const parsedBody = JSON.parse(responseData.body);
      const websites = parsedBody.websites || [];

      // Update local state with the new website data
      setSeoWebsites(websites);

      if (websites.length === 0) {
        toast({
          title: "No Websites Found",
          description: "No SEO websites are currently configured",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Load websites error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load websites";
      setError(errorMessage);
      toast({
        title: "Error Loading Websites",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWebsites();
  };

  const handleSetActive = async (website: Website) => {
    if (website.isActive) return;

    try {
      if (!selectedBusiness) return;
      setUpdatingWebsite(website.id);
      setError(null);

      const response = await fetch(`${API_URL}/update-active-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "business-slug": selectedBusiness,
          website_url: website.url,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update website status");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      // Update local state immediately
      setSeoWebsites((prevWebsites) =>
        prevWebsites.map((site) => ({
          ...site,
          isActive: site.id === website.id,
        }))
      );

      // Then refresh from server to ensure consistency
      await loadWebsites();

      toast({
        title: "Website Activated",
        description: `${website.name} is now the active website for content generation`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to activate website";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Refresh websites list to ensure correct state
      await loadWebsites();
    } finally {
      setUpdatingWebsite(null);
    }
  };

  useEffect(() => {
    if (selectedBusiness) {
      loadWebsites();
    }
  }, [selectedBusiness]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Website Management
          </h1>
          <p className="text-muted-foreground">
            Manage your SEO-optimized websites
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh List
          </Button>
          <Button variant="default" disabled>
            <Settings className="w-4 h-4 mr-2" />
            Add Website
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            SEO Websites
          </CardTitle>
          <CardDescription>
            Select which website to use for content generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="flex items-center justify-center p-4 text-red-500 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          ) : sortedWebsites.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
              <Globe className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No SEO websites configured
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedWebsites.map((site) => (
                <div
                  key={site.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    site.isActive
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe
                      className={`w-4 h-4 ${
                        site.isActive
                          ? "text-blue-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div className="space-y-1">
                      <h3 className="font-medium">{site.name}</h3>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {site.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {site.isActive && (
                      <span className="text-sm text-blue-600 flex items-center mr-2">
                        <Info className="w-4 h-4 mr-1" />
                        Current Active
                      </span>
                    )}
                    <Button
                      variant={site.isActive ? "default" : "outline"}
                      onClick={() => handleSetActive(site)}
                      disabled={site.isActive || updatingWebsite === site.id}
                      className="min-w-[100px]"
                    >
                      {updatingWebsite === site.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting...
                        </>
                      ) : site.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Active
                        </>
                      ) : (
                        "Set Active"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <p>
          The active website will be used for content generation. Only one
          website can be active at a time.
        </p>
      </div>
    </div>
  );
}
