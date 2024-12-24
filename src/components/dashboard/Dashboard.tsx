import React, { useState, useEffect } from "react";
import { ApiService, type BusinessProfile, type AICosts } from "@/lib/api";
import { Button } from "../ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import {
  MapPin,
  Building2,
  Link2,
  Loader2,
  RefreshCw,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { ProgressBar } from "@/components/ui";
import { URLGeneration } from "./URLGeneration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/Table";
import { useBusiness } from "@/contexts/BusinessContext";

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [aiCosts, setAiCosts] = useState<AICosts | null>(null);
  const [pageStatuses, setPageStatuses] = useState<
    { url: string; status: string; error?: string }[]
  >([]);
  const { selectedBusiness } = useBusiness();

  useEffect(() => {
    if (selectedBusiness) {
      loadBusinessProfile();
      loadProgress();
      loadAICosts();
      loadUrlList();
    }
  }, [selectedBusiness]);

  // Add this interface with the existing interfaces
  interface URLEntry {
    url: string;
    status: string;
    completedAt: string;
    error?: string;
  }

  // Add these states in the Dashboard component
  const [urlList, setUrlList] = useState<URLEntry[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadUrlList = async () => {
    try {
      const list = await ApiService.getUrlList("your-business-id");
      setUrlList(list);
    } catch (error) {
      console.error("Failed to load URL list:", error);
    }
  };

  const loadBusinessProfile = async () => {
    if (!selectedBusiness) return;

    try {
      const profile = await ApiService.getBusinessProfile(selectedBusiness);
      setBusinessProfile(profile);
    } catch (error) {
      console.error("Failed to load business profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAICosts = async () => {
    try {
      const costs = await ApiService.getAICosts("your-business-id");
      setAiCosts(costs);
    } catch (error) {
      console.error("Failed to load AI costs:", error);
    }
  };

  const loadProgress = async () => {
    try {
      const progressData = await ApiService.getProgress("your-business-id");
      // Map the progress data correctly
      setProgress((progressData.completed / progressData.total) * 100);
      setPageStatuses(
        progressData.urls.map((url) => ({
          url: url.url,
          status: url.status,
          error: url.error,
        }))
      );
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  };

  const handleGenerateSeoUrls = async () => {
    if (!selectedBusiness) return;

    try {
      setGenerating(true);
      await ApiService.generateSeoUrls(
        selectedBusiness,
        "mb-business-profiles"
      );
      await loadProgress();
    } catch (error) {
      console.error("Failed to generate SEO URLs:", error);
    } finally {
      setGenerating(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your Local SEO webpages generation settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadProgress}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Progress
          </Button>
          <Button onClick={handleGenerateSeoUrls} disabled={generating}>
            {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate SEO URLs
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Service Areas</CardTitle>
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businessProfile?.service_areas?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active service locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Business Services
            </CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {businessProfile?.business_services?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Available services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">ChatGPT Cost</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${aiCosts?.ai_cost.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Total OpenAI cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Claude Cost</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${aiCosts?.ai_cost.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Total Anthropic cost
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generation Progress</CardTitle>
          <CardDescription>
            Overview of the webpage generation progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar progress={progress} />
          <div className="mt-4 space-y-2">
            {pageStatuses.map((page, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{page.url}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {page.status === "error" && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm ${
                      page.status === "error"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {page.status}
                  </span>
                  {page.error && (
                    <span className="text-xs text-red-500">{page.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <URLGeneration />
    </div>
  );
}

export default Dashboard;
