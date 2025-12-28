import { createFileRoute } from "@tanstack/react-router";
import { FileBrowser } from "~/components/file-browser";
import { ThisPCDashboard } from "~/components/this-pc-dashboard";
import { useAuth } from "~/contexts/auth-context";
import { useCurrentDirectory } from "~/hooks/use-file-system";

export const Route = createFileRoute("/")({
  component: FileManagerHome,
});

function FileManagerHome() {
  const { isLoading } = useAuth();
  const { currentPath, navigateTo } = useCurrentDirectory();

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

  // Show ThisPCDashboard as the home page when no specific path is selected
  if (!currentPath || currentPath === "/") {
    return (
      <ThisPCDashboard
        onNavigate={(path) => {
          // When a location is clicked, navigate to that path in the file browser
          navigateTo(path);
        }}
      />
    );
  }

  // Show FileBrowser when a specific path is selected
  return <FileBrowser />;
}
