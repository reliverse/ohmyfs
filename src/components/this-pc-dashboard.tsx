import {
  audioDir,
  desktopDir,
  documentDir,
  downloadDir,
  homeDir,
  pictureDir,
  videoDir,
} from "@tauri-apps/api/path";
import {
  Camera,
  Download,
  FileText,
  HardDrive,
  Home,
  Monitor,
  Music,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";

interface SystemLocation {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  getPath: () => Promise<string>;
  key: string;
  available: boolean;
  description: string;
  color: string;
}

interface ThisPCDashboardProps {
  onNavigate?: (path: string) => void;
}

export function ThisPCDashboard({ onNavigate }: ThisPCDashboardProps) {
  const [locations, setLocations] = useState<SystemLocation[]>([]);

  const systemLocations = useMemo<SystemLocation[]>(
    () => [
      {
        name: "Home",
        icon: Home,
        getPath: homeDir,
        key: "home",
        available: true,
        description: "Your personal folder",
        color: "bg-blue-500",
      },
      {
        name: "Desktop",
        icon: Monitor,
        getPath: desktopDir,
        key: "desktop",
        available: true,
        description: "Desktop shortcuts and files",
        color: "bg-green-500",
      },
      {
        name: "Documents",
        icon: FileText,
        getPath: documentDir,
        key: "documents",
        available: true,
        description: "Store your documents",
        color: "bg-purple-500",
      },
      {
        name: "Downloads",
        icon: Download,
        getPath: downloadDir,
        key: "downloads",
        available: true,
        description: "Downloaded files",
        color: "bg-orange-500",
      },
      {
        name: "Pictures",
        icon: Camera,
        getPath: pictureDir,
        key: "pictures",
        available: true,
        description: "Photos and images",
        color: "bg-pink-500",
      },
      {
        name: "Music",
        icon: Music,
        getPath: audioDir,
        key: "music",
        available: true,
        description: "Audio files and music",
        color: "bg-indigo-500",
      },
      {
        name: "Videos",
        icon: Video,
        getPath: videoDir,
        key: "videos",
        available: true,
        description: "Video files and movies",
        color: "bg-red-500",
      },
    ],
    []
  );

  const checkLocationAvailability = useCallback(
    async (location: SystemLocation) => {
      try {
        await location.getPath();
        return { ...location, available: true };
      } catch {
        return { ...location, available: false };
      }
    },
    []
  );

  useEffect(() => {
    const loadLocations = async () => {
      const checkedLocations = await Promise.all(
        systemLocations.map(checkLocationAvailability)
      );
      setLocations(checkedLocations.filter((loc) => loc.available));
    };

    loadLocations();
  }, [checkLocationAvailability, systemLocations]);

  const handleLocationClick = useCallback(
    async (location: SystemLocation) => {
      try {
        const path = await location.getPath();
        if (onNavigate) {
          onNavigate(path);
        } else {
          console.log(`Navigate to: ${path}`);
        }
      } catch (error) {
        console.error(`Failed to navigate to ${location.name}:`, error);
      }
    },
    [onNavigate]
  );

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            <h1 className="font-bold text-3xl text-slate-900 dark:text-slate-100">
              This PC
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Access your system folders and drives
          </p>
        </div>

        {/* System Locations Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {locations.map((location) => (
            <Card
              className="group cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
              key={location.key}
              onClick={() => handleLocationClick(location)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div
                    className={`h-16 w-16 ${location.color} flex items-center justify-center rounded-full shadow-lg transition-shadow duration-200 group-hover:shadow-xl`}
                  >
                    <location.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                      {location.name}
                    </h3>
                    <p className="mt-1 text-slate-600 text-sm dark:text-slate-400">
                      {location.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats or Additional Info */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    System Folders
                  </h3>
                  <p className="text-slate-600 text-sm dark:text-slate-400">
                    {locations.length} folders available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    File Manager
                  </h3>
                  <p className="text-slate-600 text-sm dark:text-slate-400">
                    Browse and organize files
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Monitor className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Filesystem Engine
                  </h3>
                  <p className="text-slate-600 text-sm dark:text-slate-400">
                    Define folder structures
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
