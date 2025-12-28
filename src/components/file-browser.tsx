import { useNavigate } from "@tanstack/react-router";
import { homeDir } from "@tauri-apps/api/path";
import {
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  Home,
  List,
  MoreHorizontal,
  Search,
  Settings,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileList } from "~/components/file-list";
import { FileOperations } from "~/components/file-operations";
import { FilePreview } from "~/components/file-preview";
import { PerformanceIndicator } from "~/components/performance-indicator";
import { ProgressIndicator } from "~/components/progress-indicator";
import { SearchPanel } from "~/components/search-panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Separator } from "~/components/ui/separator";
import {
  useFileManagerActions,
  useFileManagerState,
} from "~/contexts/file-manager-context";
import { useCurrentDirectory, useDirectory } from "~/hooks/use-file-system";
import type { FileEntry, FileOperation } from "~/types/file";
import { QuickStructurePanel } from "./quick-structure-panel";

// Custom hook for file operations to reduce complexity
function useFileOperations(
  directoryData: { files?: FileEntry[] } | undefined,
  selectedItems: string[],
  setSelectedItems: (items: string[]) => void,
  setClipboard: (files: FileEntry[], operation: "copy" | "cut") => void,
  clipboard: { items: FileEntry[] }
) {
  return useMemo(
    () => ({
      handleSelectAll: () => {
        if (directoryData?.files) {
          setSelectedItems(directoryData.files.map((f) => f.path));
        }
      },
      handleCopy: () => {
        if (selectedItems.length > 0 && directoryData?.files) {
          const selectedFiles = directoryData.files.filter((file) =>
            selectedItems.includes(file.path)
          );
          setClipboard(selectedFiles, "copy");
        }
      },
      handleCut: () => {
        if (selectedItems.length > 0 && directoryData?.files) {
          const selectedFiles = directoryData.files.filter((file) =>
            selectedItems.includes(file.path)
          );
          setClipboard(selectedFiles, "cut");
        }
      },
      handlePaste: () => {
        if (clipboard.items.length > 0) {
          // TODO: Implement paste
        }
      },
    }),
    [
      directoryData?.files,
      setSelectedItems,
      selectedItems,
      setClipboard,
      clipboard.items.length,
    ]
  );
}

// Extract breadcrumb component to reduce complexity
function BreadcrumbNavigation({
  currentPath,
  onPathChange,
}: {
  currentPath: string;
  onPathChange: (path: string) => void;
}) {
  if (!currentPath) {
    return null;
  }

  const parts = currentPath.split("/").filter(Boolean);
  const breadcrumbs: Array<{ name: string; path: string; isLast: boolean }> =
    [];

  breadcrumbs.push({
    name: "Root",
    path: "/",
    isLast: parts.length === 0,
  });

  parts.forEach((part: string, index: number) => {
    const path = `/${parts.slice(0, index + 1).join("/")}`;
    breadcrumbs.push({
      name: part,
      path,
      isLast: index === parts.length - 1,
    });
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div className="flex items-center" key={crumb.path}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  className="cursor-pointer hover:text-primary"
                  onClick={() => onPathChange(crumb.path)}
                >
                  {crumb.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Custom hook for UI state management to reduce complexity
function useFileBrowserUI() {
  const [showSearch, setShowSearch] = useState(false);
  const [showOperations, setShowOperations] = useState(false);
  const [showStructurePanel, setShowStructurePanel] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handlePreviewFile = useCallback((file: FileEntry) => {
    setPreviewFile(file);
    setShowPreview(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteExecute = useCallback(() => {
    // TODO: Implement delete
    console.log("Deleting items:", previewFile);
    setShowDeleteDialog(false);
  }, [previewFile]);

  return {
    showSearch,
    setShowSearch,
    showOperations,
    setShowOperations,
    showStructurePanel,
    setShowStructurePanel,
    previewFile,
    showPreview,
    setShowPreview,
    showDeleteDialog,
    setShowDeleteDialog,
    handlePreviewFile,
    handleDeleteConfirm,
    handleDeleteExecute,
  };
}

// Custom hook for file action handlers to reduce complexity
function useFileActions(
  selectedItems: string[],
  directoryData: { files?: FileEntry[] } | undefined,
  handlePathChange: (path: string) => void
) {
  const handleRename = useCallback(() => {
    if (selectedItems.length === 1) {
      // TODO: Implement rename
    }
  }, [selectedItems.length]);

  const handleEnter = useCallback(() => {
    if (selectedItems.length === 1 && directoryData?.files) {
      const selectedFile = directoryData.files.find((file) =>
        selectedItems.includes(file.path)
      );
      if (selectedFile) {
        if (selectedFile.isDirectory) {
          handlePathChange(selectedFile.path);
        } else {
          // TODO: Open file
        }
      }
    }
  }, [selectedItems, directoryData?.files, handlePathChange]);

  const handleBackspace = useCallback(
    async (currentPath: string) => {
      if (currentPath !== "/") {
        const { dirname } = await import("@tauri-apps/api/path");
        const parentPath = await dirname(currentPath);
        handlePathChange(parentPath);
      }
    },
    [handlePathChange]
  );

  return {
    handleRename,
    handleEnter,
    handleBackspace,
  };
}

// Custom hook for keyboard shortcuts to reduce complexity
function useKeyboardShortcuts(
  handlers: {
    handleSelectAll: () => void;
    handleCopy: () => void;
    handleCut: () => void;
    handlePaste: () => void;
    handleDeleteConfirm: () => void;
    handleRename: () => void;
    handleEnter: () => void;
    handleBackspace: (currentPath: string) => void;
    clearSelection: () => void;
  },
  currentPath: string
) {
  return useMemo(() => {
    const handleCtrlKeyShortcuts = (e: KeyboardEvent) => {
      switch (e.key) {
        case "a":
          e.preventDefault();
          handlers.handleSelectAll();
          break;
        case "c":
          e.preventDefault();
          handlers.handleCopy();
          break;
        case "x":
          e.preventDefault();
          handlers.handleCut();
          break;
        case "v":
          e.preventDefault();
          handlers.handlePaste();
          break;
        default:
          break;
      }
    };

    const handleRegularKeyShortcuts = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Delete":
          e.preventDefault();
          handlers.handleDeleteConfirm();
          break;
        case "F2":
          e.preventDefault();
          handlers.handleRename();
          break;
        case "Enter":
          e.preventDefault();
          handlers.handleEnter();
          break;
        case "Backspace":
          e.preventDefault();
          handlers.handleBackspace(currentPath);
          break;
        case "Escape":
          e.preventDefault();
          handlers.clearSelection();
          break;
        default:
          break;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isCtrlPressed = e.ctrlKey || e.metaKey;

      if (isCtrlPressed) {
        handleCtrlKeyShortcuts(e);
      } else {
        handleRegularKeyShortcuts(e);
      }
    };

    return handleKeyDown;
  }, [
    handlers.handleSelectAll,
    handlers.handleCopy,
    handlers.handleCut,
    handlers.handlePaste,
    handlers.handleDeleteConfirm,
    handlers.handleRename,
    handlers.handleEnter,
    handlers.handleBackspace,
    handlers.clearSelection,
    currentPath,
  ]);
}

export function FileBrowser() {
  const navigate = useNavigate();
  const {
    currentPath,
    navigateTo,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useCurrentDirectory();
  const { setViewMode, clearSelection, setSelectedItems, setClipboard } =
    useFileManagerActions();
  const {
    viewMode: currentViewMode,
    selectedItems,
    operations,
    clipboard,
  } = useFileManagerState();

  const {
    showSearch,
    setShowSearch,
    showOperations,
    setShowOperations,
    showStructurePanel,
    setShowStructurePanel,
    previewFile,
    showPreview,
    setShowPreview,
    showDeleteDialog,
    setShowDeleteDialog,
    handlePreviewFile,
    handleDeleteConfirm,
    handleDeleteExecute,
  } = useFileBrowserUI();

  useEffect(() => {
    if (!currentPath) {
      navigateTo("/tmp");
    }
  }, [currentPath, navigateTo]);

  const {
    data: directoryData,
    isLoading,
    error,
    refetch: refetchDirectory,
  } = useDirectory(currentPath, {
    enabled: !!currentPath,
    showHidden: currentViewMode.showHidden,
  });

  const handlePathChange = useCallback(
    (newPath: string) => {
      if (newPath !== currentPath) {
        navigateTo(newPath);
        clearSelection();
      }
    },
    [navigateTo, currentPath, clearSelection]
  );

  const { handleSelectAll, handleCopy, handleCut, handlePaste } =
    useFileOperations(
      directoryData,
      selectedItems,
      setSelectedItems,
      setClipboard,
      clipboard
    );

  const { handleRename, handleEnter, handleBackspace } = useFileActions(
    selectedItems,
    directoryData,
    handlePathChange
  );

  const handleKeyDown = useKeyboardShortcuts(
    {
      handleSelectAll,
      handleCopy,
      handleCut,
      handlePaste,
      handleDeleteConfirm,
      handleRename,
      handleEnter,
      handleBackspace,
      clearSelection,
    },
    currentPath
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleBreadcrumbClick = (path: string) => {
    handlePathChange(path);
  };

  const toggleViewMode = () => {
    const newType = currentViewMode.type === "list" ? "grid" : "list";
    setViewMode({ type: newType });
  };

  return (
    <div className="flex h-full bg-background">
      <div className="flex flex-1 flex-col">
        <div className="border-border border-b bg-background/95 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                aria-label="Go back"
                disabled={!canGoBack}
                onClick={goBack}
                size="sm"
                variant="ghost"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Go forward"
                disabled={!canGoForward}
                onClick={goForward}
                size="sm"
                variant="ghost"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Go to home"
                onClick={() => homeDir().then(navigateTo)}
                size="sm"
                variant="ghost"
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>

            <Separator className="h-6" orientation="vertical" />

            <Button
              aria-label="Toggle search"
              className={showSearch ? "bg-accent" : ""}
              onClick={() => setShowSearch(!showSearch)}
              size="sm"
              variant="ghost"
            >
              <Search className="h-4 w-4" />
            </Button>

            <Button
              aria-label={`Switch to ${currentViewMode.type === "list" ? "grid" : "list"} view`}
              onClick={toggleViewMode}
              size="sm"
              variant="ghost"
            >
              {currentViewMode.type === "list" ? (
                <Grid3X3 className="h-4 w-4" />
              ) : (
                <List className="h-4 w-4" />
              )}
            </Button>

            <Separator className="h-6" orientation="vertical" />

            <Button
              aria-label="Quick structure panel"
              className={showStructurePanel ? "bg-accent" : ""}
              onClick={() => setShowStructurePanel(!showStructurePanel)}
              size="sm"
              variant="ghost"
            >
              <Zap className="h-4 w-4" />
            </Button>

            <Button
              aria-label="Toggle file operations"
              className={showOperations ? "bg-accent" : ""}
              onClick={() => setShowOperations(!showOperations)}
              size="sm"
              variant="ghost"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            <Button aria-label="Settings" size="sm" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <BreadcrumbNavigation
                currentPath={currentPath}
                onPathChange={handleBreadcrumbClick}
              />
            </div>

            <div className="ml-4 text-muted-foreground text-sm">
              {selectedItems.length > 0 && (
                <span>{selectedItems.length} selected</span>
              )}
            </div>
          </div>

          {showSearch && (
            <div className="mt-4">
              <SearchPanel onClose={() => setShowSearch(false)} />
            </div>
          )}

          {showOperations && (
            <div className="mt-4">
              <FileOperations onClose={() => setShowOperations(false)} />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading directory...</p>
              </div>
            </div>
          )}
          {!isLoading && error && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="mb-2 text-destructive">
                  Failed to load directory
                </p>
                <p className="text-muted-foreground text-sm">{error.message}</p>
              </div>
            </div>
          )}
          {!(isLoading || error) && directoryData && (
            <FileList
              currentPath={currentPath}
              files={directoryData.files}
              groupedFiles={directoryData.grouped}
              onNavigate={handlePathChange}
              onOpenQuickPanel={() => setShowStructurePanel(true)}
              onOpenStructureEditor={(path) => {
                // Navigate to filesystem engine with the selected path
                navigate({ to: "/filesystem-engine", search: { path } });
              }}
              onPreview={handlePreviewFile}
              viewMode={currentViewMode}
            />
          )}
        </div>

        {operations.length > 0 && (
          <div className="border-border border-t bg-background/95 p-4 backdrop-blur-sm">
            <div className="space-y-2">
              {operations.slice(0, 3).map((operation: FileOperation) => (
                <ProgressIndicator key={operation.id} operation={operation} />
              ))}
              {operations.length > 3 && (
                <p className="text-muted-foreground text-xs">
                  And {operations.length - 3} more operations...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <FilePreview
        file={previewFile}
        onOpenChange={setShowPreview}
        open={showPreview}
      />

      <PerformanceIndicator
        className="fixed right-4 bottom-4"
        fileCount={directoryData?.files.length}
        virtualized={directoryData ? directoryData.files.length > 50 : false}
      />

      <ConfirmDialog
        cancelText="Cancel"
        confirmText="Delete"
        description={`Are you sure you want to delete ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.`}
        onConfirm={handleDeleteExecute}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
        title="Delete Items"
        variant="destructive"
      />

      <QuickStructurePanel
        currentPath={currentPath}
        isOpen={showStructurePanel}
        onClose={() => setShowStructurePanel(false)}
        onDefinitionImported={(definition) => {
          // Navigate to filesystem engine with imported definition
          navigate({
            to: "/filesystem-engine",
            search: { definition: JSON.stringify(definition) },
          });
        }}
        onStructureApplied={() => {
          // Refresh the current directory after structure application
          refetchDirectory();
        }}
      />
    </div>
  );
}
