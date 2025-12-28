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
  Home,
  Monitor,
  Music,
  Video,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";

interface ThisPCProps {
  onNavigate: (path: string) => void;
}

interface SystemLocation {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  getPath: () => Promise<string>;
  key: string;
  available: boolean;
}

export function ThisPC({ onNavigate }: ThisPCProps) {
  const [locations, setLocations] = useState<SystemLocation[]>([]);

  const systemLocations = useMemo<SystemLocation[]>(
    () => [
      {
        name: "Home",
        icon: Home,
        getPath: homeDir,
        key: "home",
        available: true,
      },
      {
        name: "Desktop",
        icon: Monitor,
        getPath: desktopDir,
        key: "desktop",
        available: true,
      },
      {
        name: "Documents",
        icon: FileText,
        getPath: documentDir,
        key: "documents",
        available: true,
      },
      {
        name: "Downloads",
        icon: Download,
        getPath: downloadDir,
        key: "downloads",
        available: true,
      },
      {
        name: "Pictures",
        icon: Camera,
        getPath: pictureDir,
        key: "pictures",
        available: true,
      },
      {
        name: "Music",
        icon: Music,
        getPath: audioDir,
        key: "music",
        available: true,
      },
      {
        name: "Videos",
        icon: Video,
        getPath: videoDir,
        key: "videos",
        available: true,
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
      setLocations(
        checkedLocations.filter((loc: SystemLocation) => loc.available)
      );
    };

    loadLocations();
  }, [checkLocationAvailability, systemLocations]);

  const handleLocationClick = useCallback(
    async (location: SystemLocation) => {
      try {
        onNavigate(await location.getPath());
      } catch (error) {
        console.error(`Failed to navigate to ${location.name}:`, error);
      }
    },
    [onNavigate]
  );

  const renderIcon = (icon: SystemLocation["icon"]) => {
    return React.createElement(icon, {
      className: "mr-2 h-4 w-4 flex-shrink-0",
    });
  };

  return (
    <div className="space-y-1">
      {locations.map((location) => (
        <Button
          className="h-8 w-full justify-start px-2"
          key={location.key}
          onClick={() => handleLocationClick(location)}
          variant="ghost"
        >
          {renderIcon(location.icon)}
          <span className="truncate text-sm">{location.name}</span>
        </Button>
      ))}
    </div>
  );
}
