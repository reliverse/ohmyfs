import {
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Home,
  Image,
  Monitor,
  Music,
  Video,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useDirectory } from "~/hooks/use-file-system";
import { cn } from "~/lib/utils";
import type { FileEntry } from "~/types/file";

interface DirectoryTreeProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  rootPath?: string;
}

interface TreeNode {
  path: string;
  name: string;
  isExpanded: boolean;
  children?: TreeNode[];
  hasChildren?: boolean;
  isLoading?: boolean;
}

const SPECIAL_FOLDERS = [
  { name: "Home", path: "home", icon: Home },
  { name: "Desktop", path: "desktop", icon: Monitor },
  { name: "Documents", path: "documents", icon: FileText },
  { name: "Downloads", path: "downloads", icon: Download },
  { name: "Pictures", path: "pictures", icon: Image },
  { name: "Music", path: "music", icon: Music },
  { name: "Videos", path: "videos", icon: Video },
];

export function DirectoryTree({
  currentPath,
  onNavigate,
  rootPath = "/",
}: DirectoryTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set([rootPath])
  );

  const { data: rootData, isLoading: isLoadingRoot } = useDirectory(rootPath, {
    enabled: !!rootPath,
    showHidden: false,
  });

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      onNavigate(path);
      const pathParts = path.split("/").filter(Boolean);
      const pathsToExpand: string[] = [];
      let currentPath = "";

      for (const part of pathParts) {
        currentPath += `/${part}`;
        pathsToExpand.push(currentPath);
      }

      setExpandedPaths((prev) => new Set([...prev, ...pathsToExpand]));
    },
    [onNavigate]
  );

  const renderTreeNode = (node: TreeNode, level = 0): React.ReactElement => {
    const isExpanded = expandedPaths.has(node.path);
    const isCurrent = node.path === currentPath;
    const isRoot = node.path === rootPath;

    return (
      <div key={node.path}>
        <Button
          className={cn(
            "h-8 w-full justify-start px-2 text-left font-normal hover:bg-accent hover:text-accent-foreground",
            isCurrent && "bg-accent text-accent-foreground",
            level > 0 && "ml-4"
          )}
          onClick={() => {
            if (node.hasChildren) {
              toggleExpanded(node.path);
            }
            handleNavigate(node.path);
          }}
          variant="ghost"
        >
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {node.hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0" />
              ))}
            {!node.hasChildren && <div className="w-3" />}

            {isRoot && <HardDrive className="h-4 w-4 shrink-0" />}
            {!isRoot && isExpanded && (
              <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
            )}
            {!(isRoot || isExpanded) && (
              <Folder className="h-4 w-4 shrink-0 text-blue-500" />
            )}

            <span className="truncate text-sm">{node.name}</span>
          </div>
        </Button>

        {isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}

        {isExpanded && node.isLoading && (
          <div className={cn("ml-4 py-1", level > 0 && "ml-8")}>
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground/30 border-t-muted-foreground" />
              <span className="text-muted-foreground text-xs">Loading...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const buildTreeNodes = (files: FileEntry[]): TreeNode[] => {
    return files
      .filter((file) => file.isDirectory)
      .map((file) => ({
        path: file.path,
        name: file.name,
        isExpanded: expandedPaths.has(file.path),
        hasChildren: true, // We'll assume directories have children for now
        isLoading: false,
      }));
  };

  const treeNodes = rootData ? buildTreeNodes(rootData.files) : [];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        {SPECIAL_FOLDERS.map((folder) => {
          const Icon = folder.icon;
          return (
            <Button
              className="h-8 w-full justify-start px-2 text-left font-normal hover:bg-accent hover:text-accent-foreground"
              key={folder.path}
              onClick={() => handleNavigate(`/${folder.path}`)}
              variant="ghost"
            >
              <Icon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate text-sm">{folder.name}</span>
            </Button>
          );
        })}

        <div className="mt-4">
          <div className="px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            File System
          </div>
          {isLoadingRoot ? (
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="h-4 w-4 animate-spin rounded-full border border-muted-foreground/30 border-t-muted-foreground" />
              <span className="text-muted-foreground text-sm">Loading...</span>
            </div>
          ) : (
            treeNodes.map((node) => renderTreeNode(node))
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
