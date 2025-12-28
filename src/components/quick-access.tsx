import {
  audioDir,
  desktopDir,
  documentDir,
  downloadDir,
  homeDir,
  pictureDir,
  videoDir,
} from "@tauri-apps/api/path";
import { Clock, Folder, Home, MoreHorizontal, Star } from "lucide-react";
import { useCallback } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import {
  useFileManagerActions,
  useFileManagerState,
} from "~/contexts/file-manager-context";

interface QuickAccessProps {
  onNavigate: (path: string) => void;
}

const QUICK_LOCATIONS = [
  {
    name: "Home",
    icon: Home,
    getPath: () => homeDir(),
    key: "home",
  },
  {
    name: "Desktop",
    icon: Folder,
    getPath: () => desktopDir(),
    key: "desktop",
  },
  {
    name: "Documents",
    icon: Folder,
    getPath: () => documentDir(),
    key: "documents",
  },
  {
    name: "Downloads",
    icon: Folder,
    getPath: () => downloadDir(),
    key: "downloads",
  },
  {
    name: "Pictures",
    icon: Folder,
    getPath: () => pictureDir(),
    key: "pictures",
  },
  {
    name: "Music",
    icon: Folder,
    getPath: () => audioDir(),
    key: "music",
  },
  {
    name: "Videos",
    icon: Folder,
    getPath: () => videoDir(),
    key: "videos",
  },
];

export function QuickAccess({ onNavigate }: QuickAccessProps) {
  const { favorites, recentItems, currentPath } = useFileManagerState();
  const { addFavorite, removeFavorite, addRecentItem } =
    useFileManagerActions();

  const handleAddToFavorites = useCallback(() => {
    if (currentPath) {
      const favoriteName = currentPath.split("/").pop() || currentPath;
      addFavorite({
        id: crypto.randomUUID(),
        name: favoriteName,
        path: currentPath,
        type: "directory",
      });
    }
  }, [currentPath, addFavorite]);

  const handleRemoveFavorite = useCallback(
    (favoriteId: string) => {
      removeFavorite(favoriteId);
    },
    [removeFavorite]
  );

  const handleNavigateToFavorite = useCallback(
    (path: string) => {
      onNavigate(path);
      addRecentItem({
        id: crypto.randomUUID(),
        name: path.split("/").pop() || path,
        path,
        type: "directory",
        accessedAt: new Date(),
      });
    },
    [onNavigate, addRecentItem]
  );

  const handleLocationClick = useCallback(
    async (location: (typeof QUICK_LOCATIONS)[0]) => {
      try {
        const path = await location.getPath();
        onNavigate(path);
      } catch (error) {
        console.error(`Failed to get ${location.name} path:`, error);
      }
    },
    [onNavigate]
  );

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        {/* System Locations */}
        <div className="space-y-1">
          {QUICK_LOCATIONS.map((location) => {
            const Icon = location.icon;
            return (
              <Button
                className="h-8 w-full justify-start px-2 text-left font-normal hover:bg-accent hover:text-accent-foreground"
                key={location.key}
                onClick={() => handleLocationClick(location)}
                variant="ghost"
              >
                <Icon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate text-sm">{location.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Add to Favorites */}
        <div className="px-2 py-1">
          <Button
            className="h-8 w-full justify-start px-2 text-left font-normal hover:bg-accent hover:text-accent-foreground"
            onClick={handleAddToFavorites}
            size="sm"
            variant="ghost"
          >
            <Star className="mr-2 h-4 w-4 shrink-0" />
            <span className="text-sm">Add to Favorites</span>
          </Button>
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold text-muted-foreground text-sm">
                    Favorites
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                {favorites.slice(0, 5).map((favorite) => (
                  <div className="group relative" key={favorite.id}>
                    <Button
                      className="h-8 w-full justify-start px-2 pr-8 text-left font-normal hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleNavigateToFavorite(favorite.path)}
                      title={favorite.path}
                      variant="ghost"
                    >
                      <Folder className="mr-2 h-4 w-4 shrink-0 text-yellow-500" />
                      <span className="truncate text-sm">{favorite.name}</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button
                          className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 transform p-0 opacity-0 group-hover:opacity-100"
                          size="sm"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleNavigateToFavorite(favorite.path)
                          }
                        >
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveFavorite(favorite.id)}
                        >
                          Remove from Favorites
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Recent Items */}
        {recentItems.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 flex items-center gap-2 px-2 py-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-muted-foreground text-sm">
                  Recent
                </span>
              </div>
              <div className="space-y-1">
                {recentItems.slice(0, 5).map((recent) => (
                  <Button
                    className="h-8 w-full justify-start px-2 text-left font-normal hover:bg-accent hover:text-accent-foreground"
                    key={recent.id}
                    onClick={() => handleNavigateToFavorite(recent.path)}
                    title={`${recent.path} - ${recent.accessedAt.toLocaleDateString()}`}
                    variant="ghost"
                  >
                    <Folder className="mr-2 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="truncate text-sm">{recent.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
