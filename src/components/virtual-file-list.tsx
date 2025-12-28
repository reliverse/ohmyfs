import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo } from "react";
import { cn } from "~/lib/utils";
import type { FileEntry, FileViewMode } from "~/types/file";

interface VirtualFileListProps {
  files: FileEntry[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (file: FileEntry, index: number) => React.ReactNode;
  className?: string;
}

export function VirtualFileList({
  files,
  itemHeight,
  containerHeight,
  renderItem,
  className,
}: VirtualFileListProps) {
  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () =>
      document.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement,
    estimateSize: () => itemHeight,
    overscan: 5,
  });

  return (
    <div
      className={cn("relative", className)}
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const file = files[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(file, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hook to determine if virtualization should be used
export function useShouldVirtualize(
  fileCount: number,
  viewMode: FileViewMode
): boolean {
  // Virtualize when we have more than 100 files or in list mode with more than 50 files
  return fileCount > (viewMode.type === "list" ? 50 : 100);
}

// Hook to get appropriate item height based on view mode
export function useItemHeight(viewMode: FileViewMode): number {
  return useMemo(() => {
    switch (viewMode.type) {
      case "list":
        return 40;
      case "details":
        return 48;
      case "grid":
        return 120; // Grid items are taller
      default:
        return 40;
    }
  }, [viewMode]);
}

// Hook to get appropriate container height
export function useContainerHeight(): number {
  return 600; // Fixed height for virtual scrolling container
}
