import React, { useState, useEffect, useMemo } from "react";
import { Input, Button, Badge, Textarea } from "../ui";
import { useToast } from "../ui/Toast";
import { ApiService } from "@/lib/api";
import { Loader2, Upload } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";

export const KeywordsManagement = () => {
  const { selectedBusiness } = useBusiness();
  const maxKeywords = 999;
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [bulkKeywords, setBulkKeywords] = useState("");
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const { toast } = useToast();

  const formatKeyword = (keyword: string): string => {
    return keyword.trim().toLowerCase().replace(/\s+/g, "-");
  };

  const filteredKeywords = useMemo(
    () =>
      keywords.filter((keyword) =>
        keyword.toLowerCase().includes(filter.toLowerCase())
      ),
    [keywords, filter]
  );

  useEffect(() => {
    const fetchKeywords = async () => {
      console.group("Initial Keywords Load");
      console.log("Selected business:", selectedBusiness);

      if (!selectedBusiness) {
        console.log("No business selected, skipping fetch");
        console.groupEnd();
        return;
      }

      setIsLoading(true);
      try {
        console.log("Fetching keywords from API");
        const keywords = await ApiService.getSeoKeywords(selectedBusiness);
        console.log("Received keywords:", keywords);
        setKeywords(keywords);
      } catch (error) {
        console.error("Error fetching keywords:", error);
        toast({
          title: "Error",
          description: "Failed to load keywords",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    };

    fetchKeywords();
  }, [selectedBusiness]);

  const handleAddKeyword = async () => {
    console.group("Add Keyword Process");
    console.log("Starting handleAddKeyword");
    console.log("Current keywords:", keywords);
    console.log("Selected business:", selectedBusiness);
    console.log("New keyword:", newKeyword);

    if (!selectedBusiness || !newKeyword.trim()) {
      console.log("Validation failed - missing business or keyword");
      console.groupEnd();
      return;
    }

    const formattedKeyword = formatKeyword(newKeyword);
    console.log("Formatted keyword:", formattedKeyword);

    if (keywords.length >= maxKeywords) {
      console.log("Maximum keywords limit reached");
      toast({
        title: "Error",
        description: "Maximum keyword limit reached",
        variant: "destructive",
      });
      console.groupEnd();
      return;
    }

    if (keywords.includes(formattedKeyword)) {
      console.log("Keyword already exists");
      toast({
        title: "Error",
        description: "Keyword already exists",
        variant: "destructive",
      });
      console.groupEnd();
      return;
    }

    setIsSaving(true);
    try {
      console.log("Making API call to addSeoKeywords");
      console.log("API call parameters:", {
        businessId: selectedBusiness,
        keywords: [formattedKeyword],
      });

      const updatedKeywords = await ApiService.addSeoKeywords(
        selectedBusiness,
        [formattedKeyword]
      );

      console.log("API response received:", updatedKeywords);

      if (Array.isArray(updatedKeywords)) {
        console.log("Setting new keywords state:", updatedKeywords);
        setKeywords(updatedKeywords);
        setNewKeyword("");

        console.log("Showing success toast");
        toast({
          title: "Success",
          description: "Keyword added successfully",
        });
      } else {
        console.error("Invalid API response format:", updatedKeywords);
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      console.error("Error in handleAddKeyword:", error);
      console.error("Error details:", {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add keyword",
        variant: "destructive",
      });
    } finally {
      console.log("Resetting saving state");
      setIsSaving(false);
      console.groupEnd();
    }
  };

  const handleBulkAddKeywords = async () => {
    if (!selectedBusiness || !bulkKeywords.trim()) return;

    setIsBulkAdding(true);
    try {
      const newKeywords = bulkKeywords
        .split("\n")
        .map((kw) => formatKeyword(kw))
        .filter((kw) => kw.length > 0)
        .filter((kw) => !keywords.includes(kw));

      if (!newKeywords.length) {
        toast({
          title: "Info",
          description: "No new keywords to add",
        });
        return;
      }

      if (keywords.length + newKeywords.length > maxKeywords) {
        toast({
          title: "Error",
          description: `Cannot add ${newKeywords.length} keywords. Maximum limit is ${maxKeywords} (${keywords.length} existing)`,
          variant: "destructive",
        });
        return;
      }

      const updatedKeywords = await ApiService.addSeoKeywords(
        selectedBusiness,
        newKeywords
      );
      setKeywords(updatedKeywords);
      setBulkKeywords("");
      toast({
        title: "Success",
        description: `Added ${newKeywords.length} new keywords successfully`,
      });
    } catch (error) {
      console.error("Error adding bulk keywords:", error);
      toast({
        title: "Error",
        description: "Failed to add bulk keywords",
        variant: "destructive",
      });
    } finally {
      setIsBulkAdding(false);
    }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    if (!selectedBusiness) return;
    console.log("Attempting to remove keyword:", keyword);

    setIsSaving(true);
    try {
      // First update local state optimistically
      const filteredKeywords = keywords.filter((k) => k !== keyword);
      setKeywords(filteredKeywords);

      // Call API to delete keyword
      const payload = {
        "business-slug": selectedBusiness,
        keywords: [keyword],
      };

      console.log("Calling API to delete keyword:", payload);
      await ApiService.deleteSeoKeywords(payload);

      // Call API to get updated list to ensure sync
      const updatedKeywords = await ApiService.getSeoKeywords(selectedBusiness);
      console.log("Updated keywords after deletion:", updatedKeywords);

      setKeywords(updatedKeywords);
      toast({
        title: "Success",
        description: "Keyword removed successfully",
      });
    } catch (error) {
      console.error("Error removing keyword:", error);
      // Revert the optimistic update on error
      const currentKeywords = await ApiService.getSeoKeywords(selectedBusiness);
      setKeywords(currentKeywords);

      toast({
        title: "Error",
        description: "Failed to remove keyword",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Keywords Management</h1>
          <p className="text-gray-600">
            Manage your SEO keywords for better search engine optimization.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {keywords.length} of {maxKeywords} keywords used
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add new keyword..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
          disabled={isSaving || keywords.length >= maxKeywords}
        />
        <Button
          onClick={handleAddKeyword}
          disabled={
            !newKeyword.trim() || isSaving || keywords.length >= maxKeywords
          }
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            "Add"
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Paste multiple keywords separated by new lines..."
          value={bulkKeywords}
          onChange={(e) => setBulkKeywords(e.target.value)}
          disabled={isSaving || isBulkAdding}
          rows={5}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleBulkAddKeywords}
            disabled={!bulkKeywords.trim() || isSaving || isBulkAdding}
          >
            {isBulkAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Bulk Keywords...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Add Bulk Keywords
              </>
            )}
          </Button>
        </div>
      </div>

      <Input
        placeholder="Filter keywords..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        disabled={isSaving}
        className="max-w-md"
      />

      <div className="flex flex-wrap gap-2 min-h-[200px] max-h-[400px] overflow-y-auto border rounded-lg p-4">
        {filteredKeywords.length > 0 ? (
          filteredKeywords.map((keyword) => (
            <Badge
              key={keyword}
              variant="secondary"
              className="inline-flex items-center px-3 py-1"
              style={{ height: "fit-content" }}
            >
              {keyword}
              <button
                className="ml-2 hover:text-red-500"
                onClick={() => handleRemoveKeyword(keyword)}
                disabled={isSaving}
                aria-label={`Remove keyword ${keyword}`}
              >
                ×
              </button>
            </Badge>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {filter ? "No matching keywords found" : "No keywords added yet"}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordsManagement;
