import React from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface UploadStatus {
  id: string;
  fileName: string;
  store: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  uploadedAt?: string;
}

const PhotoProgress = ({ upload }: { upload: UploadStatus }) => {
  const getStatusColor = () => {
    switch (upload.status) {
      case "uploading":
        return "bg-blue-600";
      case "success":
        return "bg-green-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-1">
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
          <span>{upload.status}</span>
        </div>
        <span>{upload.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`${getStatusColor()} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${upload.progress}%` }}
        />
      </div>
    </div>
  );
};

export { PhotoProgress };
