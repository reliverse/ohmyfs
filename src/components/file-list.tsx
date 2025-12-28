import { Archive, FileIcon, FolderIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { ExtractionDialog } from "~/components/extraction-dialog";
import { Checkbox } from "~/components/ui/checkbox";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  useContainerHeight,
  useItemHeight,
  useShouldVirtualize,
  VirtualFileList,
} from "~/components/virtual-file-list";
import {
  useFileManagerActions,
  useFileManagerState,
} from "~/contexts/file-manager-context";
import { useFileOperations } from "~/hooks/use-file-system";
import { usePerformanceMonitor } from "~/hooks/use-performance";
import { cn } from "~/lib/utils";
// import { FixedSizeList as List } from 'react-window'; // TODO: Implement virtualization for performance
import type { FileEntry, FileViewMode } from "~/types/file";
import { isSupportedArchive } from "~/utils/compression";
import { formatDate, formatFileSize } from "~/utils/file-system";

interface FileListProps {
  files: FileEntry[];
  groupedFiles: Record<string, FileEntry[]>;
  currentPath: string;
  onNavigate: (path: string) => void;
  viewMode: FileViewMode;
  onPreview?: (file: FileEntry) => void;
}

interface FileItemProps {
  file: FileEntry;
  isSelected: boolean;
  viewMode: FileViewMode;
  currentPath: string;
  onClick: (file: FileEntry, event?: React.MouseEvent) => void;
  onDoubleClick: (file: FileEntry) => void;
  onContextMenu: (file: FileEntry) => void;
  onToggleSelect: (file: FileEntry) => void;
  onCopy?: (files: FileEntry[]) => void;
  onCut?: (files: FileEntry[]) => void;
  onPaste?: () => void;
  onDelete?: (files: FileEntry[]) => void;
  onRename?: (file: FileEntry) => void;
  onOpen?: (file: FileEntry) => void;
  onOpenWith?: (file: FileEntry) => void;
  onPreview?: (file: FileEntry) => void;
  onProperties?: (file: FileEntry) => void;
  canPaste: boolean;
}

function GridFileItem({
  file,
  isSelected,
  currentPath,
  onClick,
  onDoubleClick,
  onContextMenu,
  onToggleSelect,
  onOpen,
  onPreview,
  onProperties,
  canPaste,
}: Omit<
  FileItemProps,
  | "viewMode"
  | "onCopy"
  | "onCut"
  | "onPaste"
  | "onDelete"
  | "onRename"
  | "onOpenWith"
>) {
  const handleClick = useCallback(
    (event?: React.MouseEvent) => {
      onClick(file, event);
    },
    [file, onClick]
  );

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(file);
  }, [file, onDoubleClick]);

  const handleContextMenu = useCallback(() => {
    onContextMenu(file);
  }, [file, onContextMenu]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          className={cn(
            "group relative cursor-pointer rounded-lg border p-3 transition-colors",
            isSelected
              ? "border-accent-foreground/20 bg-accent"
              : "border-transparent hover:border-accent-foreground/10 hover:bg-accent/50"
          )}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          type="button"
        >
          {/* Selection checkbox */}
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onCheckedChange={() => onToggleSelect(file)}
            />
          </div>

          {/* File icon */}
          <div className="mb-2 flex flex-col items-center gap-2">
            {file.isDirectory ? (
              <FolderIcon className="h-12 w-12 text-blue-500" />
            ) : (
              <FileIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {/* File name */}
          <div className="text-center">
            <p className="truncate font-medium text-sm" title={file.name}>
              {file.name}
            </p>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onOpen?.(file)}>Open</ContextMenuItem>
        {file.isFile && isSupportedArchive(file.name) && (
          <ExtractionDialog currentPath={currentPath} file={file}>
            <ContextMenuItem onClick={(e) => e.preventDefault()}>
              <Archive className="mr-2 h-4 w-4" />
              Extract Here
            </ContextMenuItem>
          </ExtractionDialog>
        )}
        {file.isFile && (
          <ContextMenuItem onClick={() => onPreview?.(file)}>
            Preview
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {canPaste && <ContextMenuItem>Paste</ContextMenuItem>}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onProperties?.(file)}>
          Properties
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ListFileItem({
  file,
  isSelected,
  onClick,
  onDoubleClick,
  onContextMenu,
  onToggleSelect,
  viewMode,
}: Omit<
  FileItemProps,
  | "currentPath"
  | "canPaste"
  | "onCopy"
  | "onCut"
  | "onPaste"
  | "onDelete"
  | "onRename"
  | "onOpen"
  | "onOpenWith"
  | "onPreview"
  | "onProperties"
>) {
  const handleClick = useCallback(
    (event?: React.MouseEvent) => {
      onClick(file, event);
    },
    [file, onClick]
  );

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(file);
  }, [file, onDoubleClick]);

  const handleContextMenu = useCallback(() => {
    onContextMenu(file);
  }, [file, onContextMenu]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          className={cn(
            "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors",
            isSelected
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          type="button"
        >
          {/* Selection checkbox */}
          <Checkbox
            checked={isSelected}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            onCheckedChange={() => onToggleSelect(file)}
          />

          {/* File icon */}
          {file.isDirectory ? (
            <FolderIcon className="h-5 w-5 shrink-0 text-blue-500" />
          ) : (
            <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}

          {/* File name */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm" title={file.name}>
              {file.name}
            </p>
          </div>

          {/* File details */}
          {viewMode.type === "details" && (
            <>
              <div className="w-20 shrink-0 text-right text-muted-foreground text-sm">
                {file.size ? formatFileSize(file.size) : "--"}
              </div>
              <div className="w-32 shrink-0 text-right text-muted-foreground text-sm">
                {file.modifiedAt ? formatDate(file.modifiedAt) : "--"}
              </div>
            </>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuItem>Open in New Window</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem>Cut</ContextMenuItem>
        <ContextMenuItem>Paste</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuItem>Delete</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Properties</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function FileItem({
  file,
  isSelected,
  viewMode,
  currentPath,
  onClick,
  onDoubleClick,
  onContextMenu,
  onToggleSelect,
  onCopy: _onCopy,
  onCut: _onCut,
  onPaste: _onPaste,
  onDelete: _onDelete,
  onRename: _onRename,
  onOpen,
  onOpenWith: _onOpenWith,
  onPreview,
  onProperties,
  canPaste,
}: FileItemProps) {
  if (viewMode.type === "grid") {
    return (
      <GridFileItem
        canPaste={canPaste}
        currentPath={currentPath}
        file={file}
        isSelected={isSelected}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onDoubleClick={onDoubleClick}
        onOpen={onOpen}
        onPreview={onPreview}
        onProperties={onProperties}
        onToggleSelect={onToggleSelect}
      />
    );
  }

  return (
    <ListFileItem
      file={file}
      isSelected={isSelected}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onToggleSelect={onToggleSelect}
      viewMode={viewMode}
    />
  );
}

export function FileList({
  files,
  groupedFiles,
  currentPath,
  onNavigate,
  viewMode,
  onPreview,
}: FileListProps) {
  const {
    setClipboard,
    clearSelection,
    setSelectedItems,
    addSelectedItem,
    removeSelectedItem,
  } = useFileManagerActions();
  const { selectedItems: currentSelectedItems, clipboard } =
    useFileManagerState();
  const { delete: deleteFiles } = useFileOperations();
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<FileEntry[]>([]);

  // Performance monitoring
  usePerformanceMonitor("FileList", files.length > 100);

  // Virtualization
  const shouldVirtualize = useShouldVirtualize(files.length, viewMode);
  const itemHeight = useItemHeight(viewMode);
  const containerHeight = useContainerHeight();

  const handleFileClick = useCallback(
    (file: FileEntry, index: number, event?: React.MouseEvent) => {
      const isCtrlPressed = event ? event.ctrlKey || event.metaKey : false;
      const isShiftPressed = event ? event.shiftKey : false;

      if (isShiftPressed && lastSelectedIndex !== -1) {
        // Range selection
        const startIndex = Math.min(lastSelectedIndex, index);
        const endIndex = Math.max(lastSelectedIndex, index);
        const rangeSelection = files
          .slice(startIndex, endIndex + 1)
          .map((f) => f.path);
        setSelectedItems(rangeSelection);
      } else if (isCtrlPressed) {
        // Toggle selection
        if (currentSelectedItems.includes(file.path)) {
          removeSelectedItem(file.path);
        } else {
          addSelectedItem(file.path);
          setLastSelectedIndex(index);
        }
      } else {
        // Single selection
        setSelectedItems([file.path]);
        setLastSelectedIndex(index);
      }
    },
    [
      files,
      currentSelectedItems,
      lastSelectedIndex,
      addSelectedItem,
      removeSelectedItem, // Single selection
      setSelectedItems,
    ]
  );

  const handleFileDoubleClick = useCallback(
    (file: FileEntry) => {
      if (file.isDirectory) {
        onNavigate(file.path);
      } else {
        // TODO: Open file with default application
        console.log("Open file:", file.path);
      }
    },
    [onNavigate]
  );

  const handleFileContextMenu = useCallback(
    (file: FileEntry) => {
      if (!currentSelectedItems.includes(file.path)) {
        setSelectedItems([file.path]);
      }
    },
    [currentSelectedItems, setSelectedItems]
  );

  const handleToggleSelect = useCallback(
    (file: FileEntry) => {
      if (currentSelectedItems.includes(file.path)) {
        removeSelectedItem(file.path);
      } else {
        addSelectedItem(file.path);
      }
    },
    [currentSelectedItems, addSelectedItem, removeSelectedItem]
  );

  const handleCopy = useCallback(
    (files: FileEntry[]) => {
      setClipboard(files, "copy");
    },
    [setClipboard]
  );

  const handleCut = useCallback(
    (files: FileEntry[]) => {
      setClipboard(files, "cut");
    },
    [setClipboard]
  );

  const handlePaste = useCallback(() => {
    // TODO: Implement paste
    console.log("Paste:", clipboard);
  }, [clipboard]);

  const handleDelete = useCallback((files: FileEntry[]) => {
    setFilesToDelete(files);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const paths = filesToDelete.map((f) => f.path);
    try {
      await deleteFiles({ paths });
      clearSelection();
    } catch (error) {
      console.error("Delete failed:", error);
    }
    setDeleteDialogOpen(false);
    setFilesToDelete([]);
  }, [filesToDelete, deleteFiles, clearSelection]);

  const handleRename = useCallback((file: FileEntry) => {
    // TODO: Show rename dialog
    console.log("Rename:", file);
  }, []);

  const handleOpen = useCallback(
    (file: FileEntry) => {
      if (file.isDirectory) {
        onNavigate(file.path);
      } else {
        // TODO: Open file with default application
        console.log("Open file:", file);
      }
    },
    [onNavigate]
  );

  const handleOpenWith = useCallback((file: FileEntry) => {
    // TODO: Show open with dialog
    console.log("Open with:", file);
  }, []);

  const handleProperties = useCallback((file: FileEntry) => {
    // TODO: Show properties dialog
    console.log("Properties:", file);
  }, []);

  const handlePreview = useCallback(
    (file: FileEntry) => {
      if (onPreview) {
        onPreview(file);
      }
    },
    [onPreview]
  );

  const renderGroupedView = () => {
    return (
      <ScrollArea className="h-full">
        <div className="space-y-6 p-4">
          {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
            <div key={groupName}>
              <h3 className="mb-3 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
                {groupName} ({groupFiles.length})
              </h3>
              <div
                className={cn(
                  "grid gap-2",
                  viewMode.type === "grid"
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
                    : "grid-cols-1"
                )}
              >
                {groupFiles.map((file, index) => (
                  <FileItem
                    canPaste={clipboard.items.length > 0}
                    currentPath={currentPath}
                    file={file}
                    isSelected={currentSelectedItems.includes(file.path)}
                    key={file.path}
                    onClick={(file, event) =>
                      handleFileClick(file, index, event)
                    }
                    onContextMenu={handleFileContextMenu}
                    onCopy={handleCopy}
                    onCut={handleCut}
                    onDelete={handleDelete}
                    onDoubleClick={handleFileDoubleClick}
                    onOpen={handleOpen}
                    onOpenWith={handleOpenWith}
                    onPaste={handlePaste}
                    onPreview={handlePreview}
                    onProperties={handleProperties}
                    onRename={handleRename}
                    onToggleSelect={handleToggleSelect}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderListView = () => {
    if (viewMode.type === "grid") {
      return renderGroupedView();
    }

    const renderFileItem = (file: FileEntry, index: number) => (
      <FileItem
        canPaste={clipboard.items.length > 0}
        currentPath={currentPath}
        file={file}
        isSelected={currentSelectedItems.includes(file.path)}
        key={file.path}
        onClick={(file, event) => handleFileClick(file, index, event)}
        onContextMenu={handleFileContextMenu}
        onCopy={handleCopy}
        onCut={handleCut}
        onDelete={handleDelete}
        onDoubleClick={handleFileDoubleClick}
        onOpen={handleOpen}
        onOpenWith={handleOpenWith}
        onPaste={handlePaste}
        onPreview={handlePreview}
        onProperties={handleProperties}
        onRename={handleRename}
        onToggleSelect={handleToggleSelect}
        viewMode={viewMode}
      />
    );

    return (
      <ScrollArea className="h-full">
        <div className="p-4">
          {/* List Header */}
          <div className="mb-2 flex items-center gap-3 border-b px-3 py-2 font-semibold text-muted-foreground text-xs">
            <div className="w-5" /> {/* Checkbox space */}
            <div className="w-5" /> {/* Icon space */}
            <div className="flex-1">Name</div>
            {viewMode.type === "details" && (
              <>
                <div className="w-20 text-right">Size</div>
                <div className="w-32 text-right">Modified</div>
              </>
            )}
          </div>

          {/* File Items */}
          {shouldVirtualize ? (
            <VirtualFileList
              className="space-y-1"
              containerHeight={containerHeight}
              files={files}
              itemHeight={itemHeight}
              renderItem={renderFileItem}
            />
          ) : (
            <div className="space-y-1">
              {files.map((file, index) => renderFileItem(file, index))}
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };

  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">This folder is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {viewMode.groupBy && viewMode.groupBy !== "none"
        ? renderGroupedView()
        : renderListView()}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        cancelText="Cancel"
        confirmText="Delete"
        description={`Are you sure you want to delete ${filesToDelete.length} item${filesToDelete.length > 1 ? "s" : ""}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete Items"
        variant="destructive"
      />
    </div>
  );
}
