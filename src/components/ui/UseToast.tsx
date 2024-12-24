// src/components/ui/UseToast.ts
import { useState, useCallback } from "react";

export type ToastProps = {
  title?: string;
  description: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(
    ({ title, description, variant = "default" }: ToastProps) => {
      setToasts((prev) => [...prev, { title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
    },
    []
  );

  return { toast, toasts };
}
