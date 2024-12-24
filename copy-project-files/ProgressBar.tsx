// src/components/ui/ProgressBar.tsx
import React from "react";

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full h-4 bg-gray-200 rounded-full">
      <div
        className="h-4 bg-blue-600 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};
