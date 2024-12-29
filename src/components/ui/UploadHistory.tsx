// src/components/ui/UploadHistory.tsx
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { UploadStatus } from "@/types";

interface UploadHistoryProps {
  uploads: UploadStatus[];
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ uploads }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload History</CardTitle>
        <CardDescription>View the status of your photo uploads</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div key={upload.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3.5">
                  <span>{upload.fileName}</span>
                </div>
                <span>
                  {upload.status === "success"
                    ? "Successfully uploaded to Google Maps"
                    : upload.status}
                </span>
              </div>
              {upload.error && (
                <div className="text-red-500">{upload.error}</div>
              )}
              {upload.uploadedAt && (
                <div className="text-gray-500">{upload.uploadedAt}</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { UploadHistory };
