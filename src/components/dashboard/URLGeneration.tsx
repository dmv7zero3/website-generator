import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "../ui";
import {
  Loader2,
  Copy,
  Download,
  AlertCircle,
  CheckCircle,
  KeyIcon,
  MapPin,
  LinkIcon,
} from "lucide-react";
import { ApiService } from "@/lib/api";
import { useBusiness } from "@/contexts/BusinessContext";
import { useToast } from "../ui";

export interface GeneratedURL {
  id: string;
  url: string;
  status: "pending" | "generated" | "error";
  error?: string;
}

const DEFAULT_PATTERN = "/{keyword}/{city}-{state}";

const generateUrlFromPattern = (
  city: string,
  state: string,
  keyword: string
): string => {
  return DEFAULT_PATTERN.replace(
    "{city}",
    city.toLowerCase().replace(/\s+/g, "-")
  )
    .replace("{state}", state.toLowerCase().replace(/\s+/g, "-"))
    .replace("{keyword}", keyword.toLowerCase().replace(/\s+/g, "-"));
};

export function URLGeneration() {
  const { selectedBusiness } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<
    Array<{ city: string; state: string }>
  >([]);
  const [urls, setUrls] = useState<GeneratedURL[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [urlPreview, setUrlPreview] = useState({
    totalUrls: 0,
    breakdown: { cities: 0, states: 0, keywords: 0 },
  });
  const keywordCount = keywords.length;
  const serviceAreaCount = serviceAreas.length;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      if (!selectedBusiness) {
        setLoading(false);
        return;
      }

      try {
        const [keywordsData, areasData] = await Promise.all([
          ApiService.getSeoKeywords(selectedBusiness),
          ApiService.getServiceAreas(selectedBusiness),
        ]);

        if (!mounted) return;

        setKeywords(keywordsData);
        setServiceAreas(areasData);
        updateUrlPreview(keywordsData, areasData);
      } catch (error) {
        if (!mounted) return;

        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load keywords and service areas",
          variant: "destructive",
        });

        // Reset states on error
        setKeywords([]);
        setServiceAreas([]);
        updateUrlPreview([], []);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [selectedBusiness, toast]);

  const updateUrlPreview = (
    kw: string[],
    areas: Array<{ city: string; state: string }>
  ) => {
    const uniqueStates = new Set(areas.map((area) => area.state));
    const total = areas.length * kw.length;

    setUrlPreview({
      totalUrls: total,
      breakdown: {
        cities: areas.length,
        states: uniqueStates.size,
        keywords: kw.length,
      },
    });
  };

  const handleGenerateUrls = () => {
    setLoading(true);
    setUrls([]);

    setTimeout(() => {
      const generatedUrls: GeneratedURL[] = [];

      try {
        serviceAreas.forEach((area) => {
          keywords.forEach((keyword) => {
            const url = generateUrlFromPattern(area.city, area.state, keyword);

            generatedUrls.push({
              id: `${area.city}-${keyword}`.toLowerCase(),
              url,
              status: "generated",
            });
          });
        });

        setUrls(generatedUrls);
        toast({
          title: "Success",
          description: `Generated ${generatedUrls.length} URLs`,
        });
      } catch (error) {
        console.error("Error generating URLs:", error);
        toast({
          title: "Error",
          description: "Failed to generate URLs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleSaveUrls = async () => {
    if (!selectedBusiness || !urls.length) return;
    setSaving(true);
    try {
      await ApiService.saveUrlsToDynamoDB(selectedBusiness, urls);
      toast({
        title: "Success",
        description: "URLs saved successfully",
      });
    } catch (error) {
      console.error("Failed to save URLs:", error);
      toast({
        title: "Error",
        description: "Failed to save URLs",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          URL Generation
        </CardTitle>
        <CardDescription>
          Generate SEO-optimized URLs combining keywords and service areas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center p-4 border rounded-lg">
            <KeyIcon className="w-8 h-8 mr-3 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">SEO Keywords</p>
              <p className="text-2xl font-bold">{keywordCount}</p>
            </div>
          </div>
          <div className="flex items-center p-4 border rounded-lg">
            <MapPin className="w-8 h-8 mr-3 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Service Areas</p>
              <p className="text-2xl font-bold">{serviceAreaCount}</p>
            </div>
          </div>
        </div>

        {/* URL Preview Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">URL Generation Preview</CardTitle>
            <CardDescription>
              URLs will be generated using pattern: {DEFAULT_PATTERN}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Actions Section */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateUrls}
            disabled={loading || !keywordCount || !serviceAreaCount}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate URLs"
            )}
          </Button>
        </div>

        {/* URL List */}
        {urls.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                Generated URLs ({urls.length})
              </p>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => {}}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => {}}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {urls.map((url) => (
                <div
                  key={url.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="flex items-center">
                    {url.status === "error" ? (
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    )}
                    <span className="text-sm font-mono">{url.url}</span>
                  </span>
                  {url.error && (
                    <span className="text-sm text-red-500">{url.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
