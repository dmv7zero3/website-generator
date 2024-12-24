/**
 * API Service for business profile management
 *
 * Key features:
 * - Business profile CRUD operations
 * - SEO URL generation
 * - Progress tracking
 * - AI cost monitoring
 *
 * Imports:
 * • axios - HTTP client for API requests
 * • axiosRetry - Adds retry capability for failed requests
 * • utils - Environment variable management
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import axiosRetry from "axios-retry";
import { getEnvVar } from "./utils";
import { GeneratedURL } from "@/components/dashboard/URLGeneration";

// Constants
const API_BASE_URL =
  "https://wcvi65m780.execute-api.us-east-1.amazonaws.com/prod";

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 1;

// Add at top with other constants
const ENDPOINTS = {
  CREATE_PROFILE: "/website-generator/create-business-profile",
  DELETE_PROFILE: "/website-generator/delete-business-profile",
  GENERATE_CONTENT: "/website-generator/generate-page-content",
  SEO_URLS: "/website-generator/generate-seo-urls",
  BUSINESS_PROFILE_DETAILS: "/website-generator/get-business-profile-details",
  BUSINESS_PROFILES: "/website-generator/get-business-profiles",
  GET_PROMPTS: "/website-generator/get-prompts",
  GET_SEO_KEYWORDS: "/website-generator/get-seo-keywords",
  GET_SERVICE_AREAS: "/website-generator/get-service-areas",
  ADD_SERVICE_AREA: "/website-generator/add-service-area",
  DELETE_SERVICE_AREA: "/website-generator/delete-service-area",
  UPDATE_PROFILE: "/website-generator/update-business-profile-details",
  UPDATE_KEYWORDS: "/website-generator/update-keywords",
  UPDATE_PROMPTS: "/website-generator/update-prompts",
  SAVE_GENERATED_URLS: "/website-generator/save-generated-urls",
  GET_GENERATED_URLS: "/website-generator/get-generated-urls",
  DELETE_GENERATED_URLS: "/website-generator/delete-generated-urls",
  ADD_SEO_KEYWORDS: "/website-generator/add-seo-keywords",
  SEND_URLS_TO_QUEUE: "/website-generator/send-urls-to-queue",
} as const;

// Interfaces
export interface BusinessServicesUpdate {
  businessservices: {
    M: Record<string, { S: string }>;
  }[];
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface GenerateUrlsResponse {
  urls: Array<{
    id: string;
    url: string;
  }>;
}

interface BusinessListResponse {
  statusCode: number;
  body: string;
}

interface GenerateSeoUrlsParams {
  businessId: string;
  tableName: string;
}

interface BusinessItem {
  PK: { S: string };
  SK: { S: string };
  name: { S: string };
}

interface ServiceAreasUpdateRequest {
  "business-slug": string;
  serviceAreas: ServiceArea[];
}

interface DynamoDBPrompt {
  M: {
    title: { S: string };
    content: { S: string };
    category: { S: string };
    isActive: { BOOL: boolean };
    variables: { L: Array<{ S: string }> };
  };
}

interface DynamoDBPrompts {
  M: {
    [id: string]: DynamoDBPrompt;
  };
}

interface KeywordsResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
interface UpdateKeywordsRequest {
  "business-slug": string;
  keywords: string[];
}

interface ServiceArea {
  city: string;
  state: string;
}

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  variables: string[];
  metadata?: {
    lastUsed?: string;
    version?: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface PageContent {
  url: string;
  content: string;
  metadata: Record<string, string>;
}

interface ServiceAreasResponse {
  serviceAreas: ServiceArea[];
}

export interface BusinessService {
  name: string;
  description: string;
  price: string;
}

export interface BusinessProfileData {
  PK: { S: string };
  name: { S: string };
}

export interface BusinessProfile {
  business_id: string;
  business_name: string;
  business_website: string;
  business_industry: string;
  business_address1: string;
  business_address2?: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  company_history_description?: string;
  target_audience_description?: string;
  service_areas?: string[];
  business_services?: string[];
  seoKeywords?: string[];
  seoWebsites?: Array<{ website: { S: string } }>;
  prompts?: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    isActive: boolean;
    variables: string[];
    metadata?: {
      lastUsed?: string;
      version?: number;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}

export interface DynamoDBBusinessProfile {
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
      history: { S: string };
      audience: { S: string };
    };
  };
  prompts: {
    M: {
      [id: string]: {
        M: {
          title: { S: string };
          content: { S: string };
          category: { S: string };
          isActive: { BOOL: boolean };
          variables: { L: Array<{ S: string }> };
        };
      };
    };
  };
  serviceAreas: {
    L: Array<{
      M: {
        city: { S: string };
        state: { S: string };
      };
    }>;
  };
  businessServices: {
    L: Array<{ S: string }>;
  };
  seoKeywords: {
    L: Array<{ S: string }>;
  };
  metadata: {
    M: {
      createdAt: { S: string };
      updatedAt: { S: string };
      version: { N: number };
    };
  };
}

export interface URLEntry {
  url: string;
  status: "pending" | "completed" | "failed";
  completedAt: string;
  error?: string;
}

export interface AICosts {
  ai_cost: number;
  total_tokens: number;
  last_updated: string;
  ai_model: "claude" | "chatgpt";
}

// Custom error class
export class AppError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message);
    this.name = "AppError";
  }
}

// API Client setup
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure retry strategy
axiosRetry(apiClient as any, {
  retries: MAX_RETRIES,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});

// Add transformer functions
// Update transformers with proper typing
export const transformers = {
  fromDynamoDB(dbProfile: DynamoDBBusinessProfile): BusinessProfile {
    return {
      business_id: dbProfile.PK?.S?.replace("BUS#", "") || "",
      business_name: dbProfile.name?.S || "",
      business_website: dbProfile.website?.S || "",
      business_industry: dbProfile.industry?.S || "",
      business_address1: dbProfile.location?.M?.addressLine1?.S || "",
      business_address2: dbProfile.location?.M?.addressLine2?.S || "",
      business_city: dbProfile.location?.M?.city?.S || "",
      business_state: dbProfile.location?.M?.state?.S || "",
      business_zip: dbProfile.location?.M?.zipCode?.S || "",
      company_history_description: dbProfile.description?.M?.history?.S || "",
      target_audience_description: dbProfile.description?.M?.audience?.S || "",
      service_areas:
        dbProfile.serviceAreas?.L?.map(
          (area) => `${area.M.city.S}, ${area.M.state.S}`
        ) || [],
      business_services:
        dbProfile.businessServices?.L?.map((svc) => svc.S) || [],
      seoKeywords: dbProfile.seoKeywords?.L?.map((keyword) => keyword.S) || [],
      prompts: Object.entries(dbProfile.prompts?.M || {}).map(
        ([id, prompt]) => ({
          id,
          title: prompt.M.title.S,
          content: prompt.M.content.S,
          category: prompt.M.category.S,
          isActive: prompt.M.isActive?.BOOL ?? true,
          variables:
            prompt.M.variables?.L?.map((v: { S: string }) => v.S) || [],
          metadata: {
            createdAt:
              dbProfile.metadata?.M?.createdAt?.S || new Date().toISOString(),
            updatedAt:
              dbProfile.metadata?.M?.updatedAt?.S || new Date().toISOString(),
          },
        })
      ),
    };
  },

  toDynamoDB(profile: BusinessProfile): Partial<DynamoDBBusinessProfile> {
    return {
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
      // Add prompts here
      prompts: {
        M: (profile.prompts || []).reduce<Record<string, DynamoDBPrompt>>(
          (acc, prompt) => ({
            ...acc,
            [prompt.id]: {
              M: {
                title: { S: prompt.title }, // Add title
                content: { S: prompt.content },
                category: { S: prompt.category },
                isActive: { BOOL: prompt.isActive },
                variables: {
                  L: (prompt.variables || []).map((variable: string) => ({
                    S: variable,
                  })),
                },
              },
            },
          }),
          {}
        ),
      },
      serviceAreas: {
        L: (profile.service_areas || []).map((area) => ({
          M: {
            city: { S: area.split(", ")[0] },
            state: { S: area.split(", ")[1] },
          },
        })),
      },
      businessServices: {
        L: (profile.business_services || []).map((service) => ({
          S: service,
        })),
      },
      seoKeywords: {
        L: (profile.seoKeywords || []).map((keyword) => ({
          S: keyword,
        })),
      },
    };
  },
};
// Update API methods to use transformers
// In api.ts, modify the ApiService object

const ApiService = {
  // Error handling helper
  handleApiError(error: unknown, message: string, code: string): never {
    if (error instanceof Error) {
      throw new AppError(
        error.message || message,
        code,
        axios.isAxiosError(error) ? error.response?.status || 500 : 500
      );
    }
    throw new AppError(message, code, 500);
  },

  // Active endpoint
  async getBusinessList(): Promise<BusinessProfileData[]> {
    try {
      const response = await apiClient.get<BusinessListResponse>(
        ENDPOINTS.BUSINESS_PROFILES
      );

      // Validate response
      if (!response.data || !response.data.body) {
        console.error("Invalid response structure:", response);
        return [];
      }

      // Handle case where body is already parsed
      const parsedData =
        typeof response.data.body === "string"
          ? JSON.parse(response.data.body)
          : response.data.body;

      // Validate parsed data
      if (!Array.isArray(parsedData)) {
        console.error("Invalid data structure:", parsedData);
        return [];
      }

      // Transform and filter out invalid entries
      return parsedData
        .filter(
          (item: any) =>
            item && item.PK && item.PK.S && item.name && item.name.S
        )
        .map((item: BusinessItem) => ({
          PK: { S: item.PK.S },
          name: { S: item.name.S },
        }));
    } catch (error) {
      console.error("API Error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [];
    }
  },

  async createBusinessProfile(profile: BusinessProfile): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.CREATE_PROFILE, profile);
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to create profile",
        "CREATE_ERROR"
      );
    }
  },
  async getPromptTemplates(businessId: string): Promise<Prompt[]> {
    try {
      const response = await apiClient.post(ENDPOINTS.GET_PROMPTS, {
        "business-slug": businessId,
      });
      return JSON.parse(response.data.body).prompts;
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to fetch prompts",
        "PROMPTS_ERROR"
      );
    }
  },
  async deleteSeoKeywords(payload: {
    "business-slug": string;
    keywords: string[];
  }): Promise<void> {
    try {
      await apiClient.post("/website-generator/delete-seo-keywords", payload);
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to delete SEO keywords",
        "DELETE_KEYWORDS_ERROR"
      );
    }
  },

  async addSeoKeywords(
    businessId: string,
    keywords: string[]
  ): Promise<string[]> {
    try {
      const payload = {
        "business-slug": businessId.replace("BUS#", ""),
        keywords: keywords.map((kw) =>
          kw.trim().toLowerCase().replace(/\s+/g, "-")
        ),
      };

      const response = await apiClient.post(
        ENDPOINTS.ADD_SEO_KEYWORDS,
        payload
      );

      // Parse nested response
      const responseBody = JSON.parse(response.data.body);

      if (!responseBody.success) {
        throw new Error(responseBody.message || "Failed to add keywords");
      }

      // Return the complete updated keywords list
      return responseBody.keywords;
    } catch (error) {
      console.error("[ApiService] addSeoKeywords error:", error);
      throw this.handleApiError(
        error,
        "Failed to add SEO keywords",
        "ADD_KEYWORDS_ERROR"
      );
    }
  },

  async updatePromptTemplate(
    businessId: string,
    prompt: Prompt
  ): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.UPDATE_PROMPTS, {
        "business-slug": businessId,
        prompt,
      });
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to update prompt",
        "UPDATE_PROMPT_ERROR"
      );
    }
  },
  async deleteBusinessProfile(businessId: string): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.DELETE_PROFILE, {
        "business-slug": businessId.replace("BUS#", ""),
      });
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to delete profile",
        "DELETE_ERROR"
      );
    }
  },

  async getServiceAreas(businessId: string): Promise<ServiceArea[]> {
    try {
      const response = await apiClient.post(ENDPOINTS.GET_SERVICE_AREAS, {
        "business-slug": businessId.replace("BUS#", ""),
      });
      const parsedData = JSON.parse(response.data.body);
      return parsedData.serviceAreas || [];
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to fetch service areas",
        "SERVICE_AREAS_ERROR"
      );
    }
  },

  async addServiceArea(
    businessId: string,
    serviceArea: ServiceArea
  ): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.ADD_SERVICE_AREA, {
        "business-slug": businessId.replace("BUS#", ""),
        serviceArea,
      });
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to add service area",
        "ADD_SERVICE_AREA_ERROR"
      );
    }
  },

  async deleteServiceArea(
    businessId: string,
    serviceArea: ServiceArea
  ): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.DELETE_SERVICE_AREA, {
        "business-slug": businessId.replace("BUS#", ""),
        serviceArea,
      });
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to delete service area",
        "DELETE_SERVICE_AREA_ERROR"
      );
    }
  },

  async saveUrlsToDynamoDB(
    businessSlug: string,
    urls: GeneratedURL[]
  ): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.SAVE_GENERATED_URLS, {
        "business-slug": businessSlug,
        urls,
      });
    } catch (error) {
      console.error("Failed to save URLs to DynamoDB:", error);
      throw new Error("Failed to save URLs to DynamoDB");
    }
  },

  async generatePageContent(
    businessId: string,
    url: string
  ): Promise<PageContent> {
    try {
      const response = await apiClient.post(ENDPOINTS.GENERATE_CONTENT, {
        "business-slug": businessId.replace("BUS#", ""),
        url,
      });
      return JSON.parse(response.data.body);
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to generate content",
        "GENERATE_ERROR"
      );
    }
  },

  async getPrompts(businessId: string): Promise<Prompt[]> {
    try {
      const response = await apiClient.post(ENDPOINTS.GET_PROMPTS, {
        "business-slug": businessId.replace("BUS#", ""),
      });
      return JSON.parse(response.data.body).prompts;
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to fetch prompts",
        "PROMPTS_ERROR"
      );
    }
  },

  async updatePrompts(businessId: string, prompts: Prompt[]): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.UPDATE_PROMPTS, {
        "business-slug": businessId.replace("BUS#", ""),
        prompts,
      });
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to update prompts",
        "UPDATE_PROMPTS_ERROR"
      );
    }
  },

  async updateBusinessProfileDetails(
    businessId: string,
    profile: Partial<BusinessProfile>
  ): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.UPDATE_PROFILE, {
        "business-slug": businessId.replace("BUS#", ""),
        profile: transformers.toDynamoDB(profile as BusinessProfile),
      });
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to update profile",
        "UPDATE_PROFILE_ERROR"
      );
    }
  },
  async getSeoKeywords(businessId: string): Promise<string[]> {
    console.group("ApiService.getSeoKeywords");
    console.log("Fetching keywords for business:", businessId);

    try {
      const response = await apiClient.post<KeywordsResponse>(
        ENDPOINTS.GET_SEO_KEYWORDS,
        {
          "business-slug": businessId.replace("BUS#", ""),
        }
      );

      console.log("Raw API response:", response);
      console.log("Response data:", response.data);

      // Parse the nested JSON body
      const parsedBody = JSON.parse(response.data.body);
      console.log("Parsed body:", parsedBody);

      if (parsedBody.error) {
        throw new Error(parsedBody.error);
      }

      const keywords = parsedBody.keywords || [];
      console.log("Extracted keywords:", keywords);
      console.groupEnd();

      return keywords;
    } catch (error) {
      console.error("getSeoKeywords error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        businessId,
      });
      console.groupEnd();
      throw this.handleApiError(
        error,
        "Failed to fetch SEO keywords",
        "KEYWORDS_ERROR"
      );
    }
  },
  async updateKeywords(businessId: string, keywords: string[]): Promise<void> {
    try {
      // Validate input
      if (!businessId || !Array.isArray(keywords)) {
        throw new Error("Invalid parameters");
      }

      // Validate and format keywords
      const validKeywords = Array.from(
        new Set(
          keywords
            .filter(Boolean)
            .map((k) => k.trim().toLowerCase())
            .filter((k) => k.length > 0)
            .map((k) => k.replace(/\s+/g, "-"))
        )
      );

      if (validKeywords.length === 0) {
        throw new Error("No valid keywords provided");
      }

      const payload: UpdateKeywordsRequest = {
        "business-slug": businessId.replace("BUS#", ""),
        keywords: validKeywords,
      };

      await apiClient.post(ENDPOINTS.UPDATE_KEYWORDS, payload);
    } catch (error) {
      console.error("[ApiService] updateKeywords error:", error);
      throw this.handleApiError(
        error,
        "Failed to update keywords",
        "UPDATE_KEYWORDS_ERROR"
      );
    }
  },

  isValidDynamoDBProfile(data: any): data is DynamoDBBusinessProfile {
    return !!(
      data &&
      data.PK?.S &&
      data.SK?.S &&
      data.name?.S &&
      data.website?.S &&
      data.industry?.S &&
      data.location?.M &&
      data.description?.M &&
      typeof data.location.M === "object" &&
      typeof data.description.M === "object"
    );
  },

  async getBusinessProfile(
    businessId: string
  ): Promise<BusinessProfile | null> {
    try {
      const response = await apiClient.post(
        ENDPOINTS.BUSINESS_PROFILE_DETAILS,
        {
          "business-slug": businessId.replace("BUS#", ""),
        }
      );

      if (!response.data) {
        throw new Error("No data received");
      }

      // Parse the nested body if needed
      const parsedBody =
        typeof response.data.body === "string"
          ? JSON.parse(response.data.body)
          : response.data.body;

      // Transform DynamoDB format to BusinessProfile
      return {
        business_id: parsedBody.PK.S.replace("BUS#", ""),
        business_name: parsedBody.name.S,
        business_website: parsedBody.website.S,
        business_industry: parsedBody.industry.S,
        business_address1: parsedBody.location?.M?.addressLine1?.S || "",
        business_address2: parsedBody.location?.M?.addressLine2?.S || "",
        business_city: parsedBody.location?.M?.city?.S || "",
        business_state: parsedBody.location?.M?.state?.S || "",
        business_zip: parsedBody.location?.M?.zipCode?.S || "",
        company_history_description:
          parsedBody.description?.M?.history?.S || "",
        target_audience_description:
          parsedBody.description?.M?.audience?.S || "",
        service_areas:
          parsedBody.serviceAreas?.L?.map(
            (area: any) => `${area.M.city.S}, ${area.M.state.S}`
          ) || [],
        seoKeywords: parsedBody.seoKeywords?.L?.map((k: any) => k.S) || [],
        seoWebsites: Object.entries(parsedBody.seoWebsites?.M || {}).map(
          ([url, data]: [string, any]) => ({
            website: { S: url },
          })
        ),
      };
    } catch (error) {
      console.error("Error fetching business profile:", error);
      return null;
    }
  },

  async updateBusinessProfile(
    businessId: string,
    profile: BusinessProfile
  ): Promise<void> {
    console.warn("Profile update endpoint temporarily disabled");
  },

  async bulkUpdateBusinessProfiles(
    profiles: Array<{ id: string; profile: BusinessProfile }>
  ): Promise<void> {
    console.warn("Bulk update endpoint temporarily disabled");
  },

  async getBusinessServices(businessId: string): Promise<BusinessService[]> {
    console.warn("Business Services endpoint temporarily disabled");
    return [];
  },

  async updateBusinessServices(
    businessId: string,
    services: BusinessService[]
  ): Promise<void> {
    console.warn("Business Services update endpoint temporarily disabled");
  },

  async getGenerationProgress(
    businessId: string
  ): Promise<{ completed: number; total: number; urls: URLEntry[] }> {
    console.warn("Generation Progress endpoint temporarily disabled");
    return { completed: 0, total: 0, urls: [] };
  },

  async getProgress(
    businessId: string
  ): Promise<{ completed: number; total: number; urls: URLEntry[] }> {
    return this.getGenerationProgress(businessId);
  },

  async getUrlList(businessId: string): Promise<URLEntry[]> {
    console.warn("URL List endpoint temporarily disabled");
    return [];
  },

  async generateSeoUrls(
    businessId: string,
    tableName: string
  ): Promise<GenerateUrlsResponse> {
    try {
      const response = await apiClient.post(ENDPOINTS.SEO_URLS, {
        "business-slug": businessId.replace("BUS#", ""),
        tableName,
      });
      return JSON.parse(response.data.body);
    } catch (error) {
      throw this.handleApiError(
        error,
        "Failed to generate SEO URLs",
        "GENERATE_URLS_ERROR"
      );
    }
  },

  async getAICosts(businessId: string): Promise<AICosts | null> {
    console.warn("AI Costs endpoint temporarily disabled");
    return null;
  },
};

export { ApiService };
