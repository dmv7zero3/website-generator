import React, { useState, ReactNode, useEffect } from "react";
import { Header } from "./Header";
import PinPopup from "@/components/ui/PinPopup";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isPinValid, setIsPinValid] = useState<boolean>(false);
  const [isPinPopupVisible, setIsPinPopupVisible] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(true);

  useEffect(() => {
    if (isPinValid && !isLocked) {
      setIsPinPopupVisible(false);
    } else {
      setIsPinPopupVisible(true);
    }
  }, [isPinValid, isLocked]);

  const handlePinSubmit = (pin: string) => {
    if (pin === "202") {
      setIsPinValid(true);
      setIsLocked(false);
    } else {
      // Handle incorrect PIN logic if needed
    }
  };

  const handleLock = () => {
    setIsLocked(true);
  };

  return (
    <div>
      <Header isPinValid={isPinValid} handleLock={handleLock} />
      <main>
        {isPinPopupVisible && (
          <PinPopup
            onClose={() => setIsPinPopupVisible(false)}
            onSubmit={handlePinSubmit}
          />
        )}
        {!isPinPopupVisible && children}
      </main>
    </div>
  );
}
