import { Cloud, CloudOff, Sun, Moon, LogOut, Loader2 } from "lucide-react";
import { useSync } from "@/contexts/SyncContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Header() {
  const { status, isConnected } = useSync();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const getSyncIcon = () => {
    switch (status) {
      case "syncing":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "synced":
        return <Cloud className="h-5 w-5 text-success" />;
      case "offline":
        return <CloudOff className="h-5 w-5 text-destructive" />;
    }
  };

  const getSyncLabel = () => {
    switch (status) {
      case "syncing":
        return "Syncing to cloud...";
      case "synced":
        return isConnected ? "Connected & Synced" : "Synced (checking connection...)";
      case "offline":
        return "Offline - Changes saved locally";
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <img 
            src="https://i.imgur.com/3tWFJXW.png" 
            alt="WYRD & WEFT" 
            className="logo-rotate h-12 w-12 cursor-pointer dark:invert transition-transform duration-300"
          />
          <div className="flex flex-col">
            <span className="font-medium tracking-wide text-lg">WYRD-LEDGER</span>
            <span className="text-xs text-muted-foreground">Order Management Tool</span>
          </div>
        </div>

        {/* Right side icons: Sync → Email → Theme → Sign Out */}
        <div className="flex items-center gap-4">
          <TooltipProvider>
            {/* Sync Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-sm text-muted-foreground cursor-default transition-colors hover:text-foreground">
                  {getSyncIcon()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sync Status: {getSyncLabel()}</p>
              </TooltipContent>
            </Tooltip>

            {/* User Email */}
            {user && (
              <span className="text-sm text-muted-foreground hidden md:block">
                {user.email}
              </span>
            )}

            {/* Theme Toggle & Sign Out - Grouped with tighter spacing */}
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-9 w-9 transition-all duration-200 hover:scale-110"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</p>
                </TooltipContent>
              </Tooltip>

              {/* Sign Out */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    className="h-9 w-9 transition-all duration-200 hover:scale-110"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
