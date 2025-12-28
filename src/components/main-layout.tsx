import { ErrorBoundary } from "~/components/error-boundary";
import { Header } from "~/components/header";
import {
  type SidebarContext,
  UnifiedSidebar,
} from "~/components/unified-sidebar";
import { useCurrentDirectory } from "~/hooks/use-file-system";

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContext?: SidebarContext;
}

export function MainLayout({
  children,
  showSidebar = true,
  sidebarContext = "file-manager",
}: MainLayoutProps) {
  const { currentPath, navigateTo } = useCurrentDirectory();

  const handleSidebarNavigate = (path: string) => {
    navigateTo(path);
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col">
        {/* Header - appears on all routes with lowest z-index */}
        <Header />

        {/* Main content area with sidebar and content */}
        <div className="flex flex-1 overflow-hidden">
          {showSidebar && (
            <UnifiedSidebar
              context={sidebarContext}
              currentPath={currentPath}
              onNavigate={handleSidebarNavigate}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
