// src/components/dashboard/Sidebar.tsx
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import {
  LayoutDashboard,
  Building,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  Globe,
  Image,
  MessageSquare,
  CreditCard,
  Tags,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { ApiService } from "@/lib/api";

interface BusinessProfileData {
  PK: { S: string };
  name: { S: string };
}

export function Sidebar() {
  const { selectedBusiness, setSelectedBusiness, businesses, loading } =
    useBusiness();

  const [businessProfiles, setBusinessProfiles] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  useEffect(() => {
    const fetchBusinessProfiles = async () => {
      try {
        setIsLoading(true);

        // First check localStorage
        const cachedProfiles = localStorage.getItem("businessProfiles");
        if (cachedProfiles) {
          const parsed = JSON.parse(cachedProfiles);
          setBusinessProfiles(parsed);

          // Auto-select first business if none selected
          if (!selectedBusiness && parsed.length > 0) {
            setSelectedBusiness(parsed[0].id);
          }

          setIsLoading(false);
          return;
        }

        // If no cache, fetch from API
        const profiles = await ApiService.getBusinessList();
        if (Array.isArray(profiles)) {
          const transformed = profiles.map((profile) => ({
            id: profile.PK.S.replace("BUS#", ""),
            name: profile.name.S,
          }));

          // Save to localStorage
          localStorage.setItem("businessProfiles", JSON.stringify(transformed));

          // Update state
          setBusinessProfiles(transformed);

          // Auto-select first business if none selected
          if (!selectedBusiness && transformed.length > 0) {
            setSelectedBusiness(transformed[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch business profiles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessProfiles();
  }, [selectedBusiness, setSelectedBusiness]);

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "Business Profile",
      icon: Building,
      path: "/dashboard/business-profile",
    },
    {
      title: "Prompt Management",
      icon: MessageSquare,
      path: "/dashboard/prompts",
    },
    {
      title: "SEO Keywords",
      icon: Tags,
      path: "/dashboard/keywords",
    },
    {
      title: "Service Areas",
      icon: MapPin,
      path: "/dashboard/service-areas",
    },
    {
      title: "Website Management",
      icon: Globe,
      path: "/dashboard/websites",
    },
    {
      title: "URL Generation",
      icon: LinkIcon,
      path: "/dashboard/url-generation",
    },

    // {
    //   title: "Business Services",
    //   icon: Building2,
    //   path: "/dashboard/business-services",
    // },

    {
      title: "Generate Pages",
      icon: FileText,
      path: "/dashboard/page-content-generation",
    },
    {
      title: "Local SEO Photos",
      icon: Image,
      path: "/dashboard/local-seo-photos",
    },
  ];

  return (
    <div
      className={cn(
        "relative border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute w-8 h-8 border rounded-full -right-4 top-2 bg-background"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>

      <div className={cn("p-4", isCollapsed && "hidden")}>
        <Select
          value={selectedBusiness || undefined}
          onValueChange={setSelectedBusiness}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select business..." />
          </SelectTrigger>
          <SelectContent>
            {businessProfiles.map((business) => (
              <SelectItem key={business.id} value={business.id}>
                {business.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <nav className="flex flex-col p-4 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} className="w-full">
            <Button
              variant="ghost"
              className={cn(
                "w-full transition-all duration-300 justify-start",
                isCollapsed ? "px-2" : "px-4",
                {
                  "bg-accent": isActive(item.path),
                }
              )}
            >
              <item.icon
                className={cn(
                  "min-w-[20px] h-5",
                  isCollapsed ? "mx-auto" : "mr-2"
                )}
              />
              <span
                className={cn(
                  "transition-all duration-300 overflow-hidden",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                {item.title}
              </span>
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
}
