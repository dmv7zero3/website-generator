// src/components/ui/UploadPopup.tsx
import React from "react";
import { Button } from "@/components/ui/Button";
import { UploadStatus } from "@/types";

interface UploadPopupProps {
  uploads: UploadStatus[];
  onClose: () => void;
  totalPhotosSaved: number;
}

const UploadPopup: React.FC<UploadPopupProps> = ({
  uploads,
  onClose,
  totalPhotosSaved,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Upload Summary</h3>
          </div>
          <div className="space-y-2">
            {uploads.map((upload) => (
              <div key={upload.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>{upload.fileName}</span>
                  </div>
                  <span>{upload.status}</span>
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
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
          <p className="mt-4 text-center">
            Total Photos Saved: {totalPhotosSaved}
          </p>
        </div>
      </div>
    </div>
  );
};

export { UploadPopup };
