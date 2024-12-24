import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";
import { useToast } from "@/components/ui/UseToast";
import { useBusiness } from "@/contexts/BusinessContext";
import { ApiService } from "@/lib/api";
import {
  Loader2,
  Globe,
  FileText,
  Link2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface Website {
  url: string;
  id: string;
  name: string;
  isActive: boolean;
}

interface GeneratedURL {
  id: string;
  url: string;
  status: "pending" | "generated" | "error";
  error?: string;
}

interface GeneratedContent {
  id: string;
  url: string;
  status: "pending" | "generated" | "error";
  content?: string;
  error?: string;
}

const DEFAULT_PATTERN = "/{keyword}/{city}-{state}";

export function PageGeneration() {
  const { selectedBusiness } = useBusiness();
  const [activeWebsite, setActiveWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [urls, setUrls] = useState<GeneratedURL[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>(
    []
  );
  const { toast } = useToast();
  const [urlPreview, setUrlPreview] = useState({
    totalUrls: 0,
    breakdown: { cities: 0, states: 0, keywords: 0 },
  });
  const [promptTemplate, setPromptTemplate] = useState<string>("");

  useEffect(() => {
    if (selectedBusiness) {
      loadActiveWebsite();
      loadUrlData();
      loadPromptTemplate();
    }
  }, [selectedBusiness]);

  const loadActiveWebsite = async () => {
    if (!selectedBusiness) return;

    try {
      setLoading(true);
      const response = await fetch(
        "https://wcvi65m780.execute-api.us-east-1.amazonaws.com/prod/website-generator/get-active-website",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "business-slug": selectedBusiness }),
        }
      );

      const data = await response.json();
      const parsedData = JSON.parse(data.body);

      if (parsedData.activeWebsite) {
        setActiveWebsite(parsedData.activeWebsite);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load active website",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUrlData = async () => {
    if (!selectedBusiness) return;

    try {
      setLoading(true);
      const [keywordsData, areasData] = await Promise.all([
        ApiService.getSeoKeywords(selectedBusiness),
        ApiService.getServiceAreas(selectedBusiness),
      ]);

      const uniqueStates = new Set(areasData.map((area) => area.state));
      const total = areasData.length * keywordsData.length;

      setUrlPreview({
        totalUrls: total,
        breakdown: {
          cities: areasData.length,
          states: uniqueStates.size,
          keywords: keywordsData.length,
        },
      });

      const generatedUrls: GeneratedURL[] = [];
      areasData.forEach((area) => {
        keywordsData.forEach((keyword) => {
          const url = DEFAULT_PATTERN.replace(
            "{city}",
            area.city.toLowerCase().replace(/\s+/g, "-")
          )
            .replace("{state}", area.state.toLowerCase().replace(/\s+/g, "-"))
            .replace("{keyword}", keyword.toLowerCase().replace(/\s+/g, "-"));

          generatedUrls.push({
            id: `${area.city}-${keyword}`.toLowerCase(),
            url,
            status: "generated",
          });
        });
      });

      setUrls(generatedUrls);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load keywords and service areas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPromptTemplate = async () => {
    if (!selectedBusiness) return;

    try {
      const prompts = await ApiService.getPromptTemplates(selectedBusiness);
      if (prompts.length > 0) {
        setPromptTemplate(prompts[0].content); // Assuming the first prompt is the active one
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load prompt template",
        variant: "destructive",
      });
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedBusiness || !selectedUrls.length || !activeWebsite) return;

    setGeneratingContent(true);
    const newGeneratedContent: GeneratedContent[] = [];

    try {
      // Send data to Lambda function
      const payload = {
        businessId: selectedBusiness,
        prompt: promptTemplate,
        urls: selectedUrls.map((url) => url.replace(/^https?:\/\/[^\/]+/, "")), // Ensure URLs are just paths
        activeWebsite: activeWebsite.url.replace(/^https?:\/\//, ""), // Remove protocol
      };

      await fetch(
        "https://wcvi65m780.execute-api.us-east-1.amazonaws.com/prod/website-generator/send-urls-to-queue",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      toast({
        title: "Success",
        description: `Sent ${selectedUrls.length} URLs to the queue for content generation`,
      });

      // Update the status of the URLs to "pending"
      const updatedUrls = urls.map((url) =>
        selectedUrls.includes(url.url)
          ? { ...url, status: "pending" as "pending" }
          : url
      );
      setUrls(updatedUrls);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send URLs to the queue",
        variant: "destructive",
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedUrls.length === urls.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(urls.map((url) => url.url));
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Page Generation</h1>
          <p className="text-muted-foreground">
            Generate SEO-optimized pages for your website
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Active Website
          </CardTitle>
          <CardDescription>
            Content will be generated for the following website
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeWebsite ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <div>
                  <h3 className="font-medium">{activeWebsite.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeWebsite.url}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <Globe className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No active website selected
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              URL Generation
            </CardTitle>
            <CardDescription>
              URLs will be generated using pattern: {DEFAULT_PATTERN}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium">Total URLs</p>
                <p className="text-2xl font-bold">{urlPreview.totalUrls}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Cities:</span>
                  <span className="font-medium">
                    {urlPreview.breakdown.cities}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>States:</span>
                  <span className="font-medium">
                    {urlPreview.breakdown.states}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Keywords:</span>
                  <span className="font-medium">
                    {urlPreview.breakdown.keywords}
                  </span>
                </div>
              </div>
            </div>

            {urls.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                <Button onClick={handleSelectAll} className="w-full">
                  {selectedUrls.length === urls.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                {urls.map((url) => (
                  <div
                    key={url.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedUrls.includes(url.url)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUrls([...selectedUrls, url.url]);
                          } else {
                            setSelectedUrls(
                              selectedUrls.filter((u) => u !== url.url)
                            );
                          }
                        }}
                        className="mt-1"
                      />
                      <span className="text-sm font-mono">{url.url}</span>
                    </span>
                    {url.error && (
                      <span className="text-sm text-red-500">{url.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Content Generation
            </CardTitle>
            <CardDescription>
              Generate content for selected URLs using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateContent}
              disabled={generatingContent || !selectedUrls.length}
              className="w-full"
            >
              {generatingContent ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Generate Content for {selectedUrls.length} URLs
                </>
              )}
            </Button>

            {generatedContent.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    Generated Content ({generatedContent.length})
                  </p>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {generatedContent.map((content) => (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="flex items-center">
                        {content.status === "error" ? (
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        )}
                        <span className="text-sm font-mono">{content.url}</span>
                      </span>
                      {content.error && (
                        <span className="text-sm text-red-500">
                          {content.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
