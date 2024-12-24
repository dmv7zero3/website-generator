// src/components/dashboard/Header.tsx
import { Button } from "../ui/Button";
import { MoonIcon, SunIcon } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">
            MarketBrewer© Local SEO Generator App
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <SunIcon className="w-5 h-5 transition-all scale-100 rotate-0" />
          </Button>
        </div>
      </div>
    </header>
  );
}
