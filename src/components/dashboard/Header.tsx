import { Button } from "../ui/Button";
import { Lock, Unlock } from "lucide-react";

interface HeaderProps {
  isPinValid: boolean;
  handleLock: () => void;
}

export function Header({ isPinValid, handleLock }: HeaderProps) {
  const handleLockToggle = () => {
    if (isPinValid) {
      handleLock();
      console.log("Screen locked");
    } else {
      console.log("User needs to enter PIN");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">
            MarketBrewer© Local SEO Generator App
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handleLockToggle}>
            {isPinValid ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
