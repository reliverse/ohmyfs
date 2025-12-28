import { DirectoryTree } from "~/components/directory-tree";
import { ScrollArea } from "~/components/ui/scroll-area";

export type SidebarContext = "file-manager" | "filesystem-engine" | "settings";

interface UnifiedSidebarProps {
  context: SidebarContext;
  currentPath?: string | null;
  onNavigate?: (path: string) => void;
  className?: string;
}

function FileManagerSidebarContent({
  currentPath,
  onNavigate,
}: {
  currentPath: string | null;
  onNavigate: (path: string) => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <DirectoryTree
          currentPath={currentPath || ""}
          onNavigate={onNavigate}
        />
      </div>
    </ScrollArea>
  );
}

function FilesystemEngineSidebarContent() {
  return (
    <div className="p-4">
      <h3 className="mb-4 font-semibold text-muted-foreground text-sm">
        Filesystem Engine
      </h3>
    </div>
  );
}

function SettingsSidebarContent() {
  return (
    <div className="p-4">
      <h3 className="mb-4 font-semibold text-muted-foreground text-sm">
        Settings
      </h3>
    </div>
  );
}

export function UnifiedSidebar({
  context,
  currentPath,
  onNavigate,
  className,
}: UnifiedSidebarProps) {
  const renderSidebarContent = () => {
    switch (context) {
      case "file-manager":
        return onNavigate ? (
          <FileManagerSidebarContent
            currentPath={currentPath || null}
            onNavigate={onNavigate}
          />
        ) : null;
      case "filesystem-engine":
        return <FilesystemEngineSidebarContent />;
      case "settings":
        return <SettingsSidebarContent />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`w-64 border-border border-r bg-muted/30 ${className || ""}`}
      style={{ zIndex: 10 }} // Higher z-index than header
    >
      {renderSidebarContent()}
    </div>
  );
}
