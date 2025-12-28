import { Link, useNavigate } from "@tanstack/react-router";
import { HardDrive, LogOut } from "lucide-react";
import { useCallback, useEffect } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { useAuth } from "~/contexts/auth-context";
import { Button } from "./ui/button";

interface FileManagerLayoutProps {
  children: React.ReactNode;
}

export default function FileManagerLayout({
  children,
}: FileManagerLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate({ to: "/auth", replace: true });
  }, [logout, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Focus search input when "/" is pressed (and not already in an input)
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="text"][placeholder*="Search"]'
        ) as HTMLInputElement;
        searchInput?.focus();
      }

      // Handle common shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "n":
            e.preventDefault();
            // TODO: New file/folder
            break;
          case "c":
            e.preventDefault();
            // TODO: Copy
            break;
          case "v":
            e.preventDefault();
            // TODO: Paste
            break;
          case "x":
            e.preventDefault();
            // TODO: Cut
            break;
          case "a":
            e.preventDefault();
            // TODO: Select all
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background font-inter text-foreground">
      {/* Skip to main content link for accessibility */}
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        href="#main-content"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="border-border border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            className="flex items-center gap-2 font-semibold text-foreground text-lg transition-colors hover:text-primary"
            to="/"
          >
            <HardDrive className="h-6 w-6" />
            <span>ohmyfs</span>
          </Link>

          {/* Right Side: Theme Toggle and Logout */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            {isAuthenticated && (
              <Button
                aria-label="Logout"
                className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                onClick={handleLogout}
                title={user ? `Logout ${user.username}` : "Logout"}
                type="button"
                variant="ghost"
              >
                <LogOut size={16} />
                <span className="hidden font-medium text-sm sm:inline">
                  Logout
                </span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden" id="main-content">
        {children}
      </main>
    </div>
  );
}
