// src/components/ui/PhotoUploadProgress.tsx
import React from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UploadStatus {
  id: string;
  fileName: string;
  store: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  uploadedAt?: string;
}

interface PhotoUploadProgressProps {
  uploads: UploadStatus[];
  onClose: () => void;
}

const PhotoUploadProgress: React.FC<PhotoUploadProgressProps> = ({
  uploads,
  onClose,
}) => {
  const totalUploads = uploads.length;
  const completedUploads = uploads.filter(
    (upload) => upload.status === "success"
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Upload Progress ({completedUploads}/{totalUploads})
        </h3>
      </div>
      <div className="space-y-2">
        {uploads.map((upload) => (
          <div key={upload.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {upload.status === "uploading" && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {upload.status === "success" && (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                )}
                {upload.status === "error" && (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                <span>{upload.fileName}</span>
              </div>
              <span>{upload.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`${
                  upload.status === "uploading"
                    ? "bg-blue-600"
                    : upload.status === "success"
                    ? "bg-green-600"
                    : "bg-red-600"
                } h-1.5 rounded-full transition-all duration-300`}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={onClose}>Okay</Button>
      </div>
    </div>
  );
};

export { PhotoUploadProgress };
