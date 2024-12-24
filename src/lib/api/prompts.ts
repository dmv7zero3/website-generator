// src/lib/api/prompts.ts
import { apiClient } from "./index";

export const PROMPT_CATEGORIES = {
  SERVICE: "service-based",
  KEYWORD: "keyword-based",
  PRODUCT: "product-based",
} as const;

export type PromptCategory =
  (typeof PROMPT_CATEGORIES)[keyof typeof PROMPT_CATEGORIES];

export interface PromptUpdateResponse {
  message: string;
  data: {
    prompts: Prompt[];
    updatedAt: string;
  };
}

export interface Prompt {
  id: string;
  content: string;
  category: PromptCategory;
  isActive: boolean;
  title?: string;
  metadata?: {
    lastUsed?: string;
    version?: number;
    createdAt?: string;
    updatedAt?: string;
    usageCount?: number;
    performance?: {
      averageTokens?: number;
      successRate?: number;
    };
  };
  variables?: string[];
}

interface PromptResponse {
  statusCode: number;
  body: string;
}

export interface PromptTemplate {
  website: {
    selected: string;
    templates: {
      [key: string]: Prompt[];
    };
  };
  seoWebsites: {
    [url: string]: {
      selected: string;
      templates: Prompt[];
    };
  };
}

export const PromptsService = {
  async getPrompts(businessId: string): Promise<Prompt[]> {
    const response = await apiClient.post<PromptResponse>(
      "/website-generator/get-prompts",
      {
        "business-slug": businessId,
      }
    );
    // Parse the nested JSON response correctly
    const parsedBody = JSON.parse(response.data.body);
    return parsedBody.prompts || []; // Return empty array as fallback
  },

  async updatePrompts(businessId: string, prompts: Prompt[]): Promise<void> {
    await apiClient.post("/website-generator/update-prompts", {
      "business-slug": businessId,
      prompts,
    });
  },
};
