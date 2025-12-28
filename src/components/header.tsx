import { useLocation, useNavigate } from "@tanstack/react-router";
import { Home, LogIn, Settings, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/auth-context";
import { useFileManagerActions } from "~/contexts/file-manager-context";

interface NavigationItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  active?: boolean;
}

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { setCurrentPath } = useFileManagerActions();

  const handleNavigateToRoute = (to: string) => {
    // Special handling for Start button - go to root route which shows app home
    if (to === "/") {
      // Reset file manager state to show ThisPCDashboard
      setCurrentPath("");
      navigate({ to: "/" });
    } else {
      navigate({ to });
    }
  };

  const navigationItems: NavigationItem[] = [
    {
      label: "ohmyfs",
      icon: Home,
      to: "/",
      active: location.pathname === "/",
    },
    {
      label: "Filesystem Engine",
      icon: Settings,
      to: "/filesystem-engine",
      active: location.pathname === "/filesystem-engine",
    },
    {
      label: "Settings",
      icon: Settings,
      to: "/settings",
      active: location.pathname === "/settings",
    },
    // Authentication item
    ...(isAuthenticated
      ? [
          {
            label: "Account",
            icon: User,
            to: "/account",
            active: location.pathname === "/account",
          },
        ]
      : [
          {
            label: "Sign In",
            icon: LogIn,
            to: "/auth",
            active: location.pathname === "/auth",
          },
        ]),
  ];

  return (
    <header
      className={`flex h-12 items-center justify-between border-b bg-background px-4 ${className || ""}`}
      style={{ zIndex: 1 }} // Lowest z-index, under everything
    >
      <div className="flex items-center gap-1">
        <nav className="flex items-center gap-1">
          {navigationItems.map((item) => (
            <Button
              className="h-8 px-3"
              key={item.to}
              onClick={() => handleNavigateToRoute(item.to)}
              size="sm"
              variant={item.active ? "secondary" : "ghost"}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
