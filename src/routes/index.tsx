import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, FileText, LogOut, Settings } from "lucide-react";
import { ErrorBoundary } from "~/components/error-boundary";
import { FileBrowser } from "~/components/file-browser";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useAuth } from "~/contexts/auth-context";

export const Route = createFileRoute("/")({
  component: FileManagerHome,
});

function FileManagerHome() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading ohmyfs...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen">
        {/* Sidebar with navigation */}
        <div className="flex w-64 flex-col border-border border-r bg-muted/30">
          <div className="p-4">
            <h2 className="mb-4 font-semibold text-lg">ohmyfs</h2>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={() => navigate({ to: "/" })}
                variant="ghost"
              >
                <FileText className="mr-2 h-4 w-4" />
                File Manager
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => navigate({ to: "/filesystem-engine" })}
                variant="ghost"
              >
                <Settings className="mr-2 h-4 w-4" />
                Filesystem Engine
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => navigate({ to: "/settings" })}
                variant="ghost"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>

            {/* Authentication Status */}
            <div className="mt-6 border-t pt-4">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm">
                    Signed in as{" "}
                    <span className="font-medium text-foreground">
                      {user.username}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      await logout();
                      navigate({ to: "/", replace: true });
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => navigate({ to: "/auth" })}
                  size="sm"
                  variant="outline"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Feature Preview */}
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  New Feature
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Define filesystem structures declaratively and apply them
                  safely.
                </CardDescription>
                <Button
                  className="mt-2 w-full"
                  onClick={() => navigate({ to: "/filesystem-engine" })}
                  size="sm"
                >
                  Try Filesystem Engine
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <FileBrowser />
        </div>
      </div>
    </ErrorBoundary>
  );
}
