// PromptsManagement.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui";
import axios from "axios";
import {
  Prompt,
  PromptCategory,
  PromptUpdateResponse,
  PROMPT_CATEGORIES,
  PromptsService,
} from "@/lib/api/prompts";

interface PromptItem {
  id: string;
  content: string;
  category: string;
  isActive: boolean;
  title?: string;
}

const API_URL =
  "https://wcvi65m780.execute-api.us-east-1.amazonaws.com/prod/website-generator/get-prompts";

export function PromptsManagement() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    PromptCategory | ""
  >();
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [updatingPromptId, setUpdatingPromptId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);
  const handleSavePrompt = async (promptId: string, updatedContent: string) => {
    setUpdatingPromptId(promptId);
    try {
      const updatedPrompts = prompts.map(
        (p): Prompt =>
          p.id === promptId
            ? {
                ...p,
                content: updatedContent,
                metadata: {
                  ...p.metadata,
                  updatedAt: new Date().toISOString(),
                },
              }
            : p
      );

      await PromptsService.updatePrompts("sls-dispensary", updatedPrompts);

      // Fetch fresh data after update
      const freshData = await PromptsService.getPrompts("sls-dispensary");
      setPrompts(freshData);

      // Update categories
      const uniqueCategories = Array.from(
        new Set(freshData.map((p) => p.category))
      ) as PromptCategory[];
      setCategories(uniqueCategories);

      setEditingPrompt(null);
    } catch (error) {
      console.error("Error updating prompt:", error);
    } finally {
      setUpdatingPromptId(null);
    }
  };
  const fetchPrompts = async () => {
    try {
      const promptsData = await PromptsService.getPrompts("sls-dispensary");

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(promptsData.map((p) => p.category))
      ) as PromptCategory[];

      setCategories(uniqueCategories);
      setSelectedCategory(uniqueCategories[0]);
      setPrompts(promptsData);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      setPrompts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = selectedCategory
    ? prompts.filter((prompt) => prompt.category === selectedCategory)
    : [];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prompt Templates</h1>
        {/* <Button variant="outline">Add New Template</Button> */}
      </div>

      {/* <div className="flex gap-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div> */}

      <div className="grid gap-4">
        {filteredPrompts.map((prompt) => (
          <div key={prompt.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <Badge>{prompt.category}</Badge>
              {editingPrompt !== prompt.id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPrompt(prompt.id)}
                >
                  Edit
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPrompt(null)}
                >
                  Cancel
                </Button>
              )}
            </div>
            {editingPrompt === prompt.id ? (
              <div className="space-y-2">
                <Textarea
                  defaultValue={prompt.content}
                  className="w-full"
                  rows={4}
                  disabled={updatingPromptId === prompt.id}
                  onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) =>
                    handleSavePrompt(prompt.id, e.target.value)
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-gray-600">{prompt.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
