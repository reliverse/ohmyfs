import {
  FileText,
  FolderOpen,
  Globe,
  Package,
  Settings,
  Zap,
} from "lucide-react";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "~/components/ui/context-menu";
import { useStructureTemplates } from "~/hooks/use-filesystem-engine";
import type { FileEntry } from "~/types/file";

interface StructureContextMenuProps {
  file: FileEntry;
  onOpenStructureEditor?: (path: string) => void;
  onOpenQuickPanel?: () => void;
  children: React.ReactNode;
}

export function StructureContextMenu({
  file,
  onOpenStructureEditor,
  onOpenQuickPanel,
  children,
}: StructureContextMenuProps) {
  const { getAvailableTemplates, applyTemplate, isApplying } =
    useStructureTemplates();

  // Only show structure options for directories
  if (!file.isDirectory) {
    return <>{children}</>;
  }

  const templates = getAvailableTemplates();

  const handleApplyTemplate = async (templateId: string) => {
    await applyTemplate(templateId, file.path);
  };

  return (
    <>
      {children}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onOpenQuickPanel?.()}>
        <Zap className="mr-2 h-4 w-4" />
        Quick Structure
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onOpenStructureEditor?.(file.path)}>
        <Settings className="mr-2 h-4 w-4" />
        Advanced Editor
      </ContextMenuItem>
      <ContextMenuSeparator />
      <div className="px-2 py-1 font-medium text-muted-foreground text-xs">
        Apply Template
      </div>
      {templates.slice(0, 3).map((template) => {
        const getIcon = () => {
          switch (template.id) {
            case "react-app":
              return <Package className="mr-2 h-4 w-4" />;
            case "node-package":
              return <FileText className="mr-2 h-4 w-4" />;
            case "web-project":
              return <Globe className="mr-2 h-4 w-4" />;
            default:
              return <FolderOpen className="mr-2 h-4 w-4" />;
          }
        };

        return (
          <ContextMenuItem
            disabled={isApplying}
            key={template.id}
            onClick={() => handleApplyTemplate(template.id)}
          >
            {getIcon()}
            {template.name}
          </ContextMenuItem>
        );
      })}
      {templates.length > 3 && (
        <ContextMenuItem onClick={() => onOpenQuickPanel?.()}>
          <Zap className="mr-2 h-4 w-4" />
          More Templates...
        </ContextMenuItem>
      )}
    </>
  );
}

export function EnhancedContextMenuContent({
  file,
  onOpenStructureEditor,
  onOpenQuickPanel,
  children,
}: StructureContextMenuProps) {
  return (
    <ContextMenuContent>
      <StructureContextMenu
        file={file}
        onOpenQuickPanel={onOpenQuickPanel}
        onOpenStructureEditor={onOpenStructureEditor}
      >
        {children}
      </StructureContextMenu>
    </ContextMenuContent>
  );
}
