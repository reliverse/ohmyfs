import {
  Download,
  FileText,
  HardDrive,
  Home,
  Image,
  Monitor,
  Music,
  Video,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { resolveSpecialFolderPath } from "~/utils/file-system";

interface DirectoryTreeProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  rootPath?: string;
}

interface SpecialFolder {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DirectoryTree({
  currentPath: _currentPath,
  onNavigate,
  rootPath: _rootPath = "/",
}: DirectoryTreeProps) {
  const [specialFolders, setSpecialFolders] = useState<SpecialFolder[]>([
    { name: "Root", path: "/", icon: HardDrive },
  ]);

  const handleNavigate = (path: string) => {
    onNavigate(path);
  };

  useEffect(() => {
    const loadSpecialFolders = async () => {
      try {
        const folders: SpecialFolder[] = [
          { name: "Root", path: "/", icon: HardDrive },
          {
            name: "Home",
            path: await resolveSpecialFolderPath("home"),
            icon: Home,
          },
          {
            name: "Desktop",
            path: await resolveSpecialFolderPath("desktop"),
            icon: Monitor,
          },
          {
            name: "Documents",
            path: await resolveSpecialFolderPath("documents"),
            icon: FileText,
          },
          {
            name: "Downloads",
            path: await resolveSpecialFolderPath("downloads"),
            icon: Download,
          },
          {
            name: "Pictures",
            path: await resolveSpecialFolderPath("pictures"),
            icon: Image,
          },
          {
            name: "Music",
            path: await resolveSpecialFolderPath("music"),
            icon: Music,
          },
          {
            name: "Videos",
            path: await resolveSpecialFolderPath("videos"),
            icon: Video,
          },
        ];
        setSpecialFolders(folders);
      } catch (error) {
        console.error("Failed to load special folder paths:", error);
        // Fallback to basic paths if Tauri APIs fail
        setSpecialFolders([
          { name: "Root", path: "/", icon: HardDrive },
          { name: "Home", path: "/home", icon: Home },
          { name: "Desktop", path: "/home/Desktop", icon: Monitor },
          { name: "Documents", path: "/home/Documents", icon: FileText },
          { name: "Downloads", path: "/home/Downloads", icon: Download },
          { name: "Pictures", path: "/home/Pictures", icon: Image },
          { name: "Music", path: "/home/Music", icon: Music },
          { name: "Videos", path: "/home/Videos", icon: Video },
        ]);
      }
    };

    loadSpecialFolders();
  }, []);

  return (
    <div className="space-y-1">
      {specialFolders.map((folder: SpecialFolder) => {
        const Icon = folder.icon;
        return (
          <Button
            className="h-8 w-full justify-start px-2 text-left font-normal hover:bg-accent hover:text-accent-foreground"
            key={folder.path}
            onClick={() => handleNavigate(folder.path)}
            variant="ghost"
          >
            <Icon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate text-sm">{folder.name}</span>
          </Button>
        );
      })}
    </div>
  );
}
