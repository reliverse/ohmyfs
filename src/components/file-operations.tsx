import { join } from "@tauri-apps/api/path";
import {
  Archive,
  ClipboardPaste,
  Copy,
  Download,
  Edit,
  FilePlus,
  FolderPlus,
  MoreHorizontal,
  Scissors,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useState } from "react";
import { BatchOperationsDialog } from "~/components/batch-operations-dialog";
import { CompressionDialog } from "~/components/compression-dialog";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  useFileManagerActions,
  useFileManagerState,
} from "~/contexts/file-manager-context";
import { useDirectory, useFileOperations } from "~/hooks/use-file-system";

interface FileOperationsProps {
  onClose: () => void;
}

export function FileOperations({ onClose }: FileOperationsProps) {
  const { selectedItems, clipboard, currentPath } = useFileManagerState();
  const { setClipboard, clearSelection } = useFileManagerActions();
  const {
    createDirectory: createDirectoryMutation,
    delete: deleteMutation,
    copy: copyMutation,
    rename: renameMutation,
  } = useFileOperations();

  // Create wrapper functions with the expected signatures
  const createDirectory = useCallback(
    async (path: string) => {
      await createDirectoryMutation({ path });
    },
    [createDirectoryMutation]
  );
  const deleteFiles = useCallback(
    async (paths: string[]) => {
      await deleteMutation({ paths });
    },
    [deleteMutation]
  );
  const copy = useCallback(
    async (sources: string[], destination: string) => {
      await copyMutation({ source: sources, destination });
    },
    [copyMutation]
  );
  const rename = useCallback(
    async (oldPath: string, newPath: string) => {
      await renameMutation({ oldPath, newPath });
    },
    [renameMutation]
  );
  const { data: currentDirectory } = useDirectory(currentPath);

  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const handleCopy = useCallback(() => {
    if (selectedItems.length === 0 || !currentDirectory) {
      return;
    }

    const selectedFiles = currentDirectory.files.filter((file) =>
      selectedItems.includes(file.path)
    );

    setClipboard(selectedFiles, "copy");
  }, [selectedItems, currentDirectory, setClipboard]);

  const handleCut = useCallback(() => {
    if (selectedItems.length === 0 || !currentDirectory) {
      return;
    }

    const selectedFiles = currentDirectory.files.filter((file) =>
      selectedItems.includes(file.path)
    );

    setClipboard(selectedFiles, "cut");
  }, [selectedItems, currentDirectory, setClipboard]);

  const handlePaste = useCallback(async () => {
    if (clipboard.items.length === 0) {
      return;
    }

    try {
      await copy(
        clipboard.items.map((item) => item.path),
        currentPath
      );
      if (clipboard.operation === "cut") {
        setClipboard([], null);
      }
    } catch (error) {
      console.error("Paste failed:", error);
    }
  }, [clipboard, currentPath, copy, setClipboard]);

  const handleDelete = useCallback(() => {
    if (selectedItems.length === 0) {
      return;
    }
    setDeleteDialogOpen(true);
  }, [selectedItems.length]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteFiles(selectedItems);
      clearSelection();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }, [selectedItems, deleteFiles, clearSelection]);

  const handleRename = useCallback(() => {
    if (selectedItems.length !== 1 || !currentDirectory) {
      return;
    }

    const selectedFile = currentDirectory.files.find((file) =>
      selectedItems.includes(file.path)
    );

    if (selectedFile) {
      setNewItemName(selectedFile.name);
      setRenameDialogOpen(true);
    }
  }, [selectedItems, currentDirectory]);

  const handleNewFolder = useCallback(() => {
    setNewItemName("New Folder");
    setNewFolderDialogOpen(true);
  }, []);

  const handleNewFile = useCallback(() => {
    setNewItemName("New File.txt");
    setNewFileDialogOpen(true);
  }, []);

  const createNewFolder = useCallback(async () => {
    if (!newItemName.trim()) {
      return;
    }

    try {
      const newPath = await join(currentPath, newItemName.trim());
      await createDirectory(newPath);
      setNewFolderDialogOpen(false);
      setNewItemName("");
    } catch (error) {
      console.error("Create folder failed:", error);
    }
  }, [newItemName, currentPath, createDirectory]);

  const createNewFile = useCallback(async () => {
    if (!newItemName.trim()) {
      return;
    }

    try {
      const newPath = await join(currentPath, newItemName.trim());
      // For now, create an empty file
      await fetch("/api/files/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: newPath, content: "" }),
      });
      setNewFileDialogOpen(false);
      setNewItemName("");
    } catch (error) {
      console.error("Create file failed:", error);
    }
  }, [newItemName, currentPath]);

  const renameItem = useCallback(async () => {
    if (
      !newItemName.trim() ||
      selectedItems.length !== 1 ||
      !currentDirectory
    ) {
      return;
    }

    const selectedFile = currentDirectory.files.find((file) =>
      selectedItems.includes(file.path)
    );

    if (!selectedFile) {
      return;
    }

    try {
      const newPath = await join(currentPath, newItemName.trim());
      await rename(selectedFile.path, newPath);
      clearSelection();
      setRenameDialogOpen(false);
      setNewItemName("");
    } catch (error) {
      console.error("Rename failed:", error);
    }
  }, [
    newItemName,
    selectedItems,
    currentDirectory,
    currentPath,
    rename,
    clearSelection,
  ]);

  const handleUpload = useCallback(() => {
    // TODO: Implement file upload with Tauri dialog
    console.log("Upload files");
  }, []);

  const handleDownload = useCallback(() => {
    // TODO: Implement file download
    console.log("Download selected items:", selectedItems);
  }, [selectedItems]);

  const getSelectedFiles = useCallback(() => {
    if (!currentDirectory) {
      return [];
    }
    return currentDirectory.files.filter((file) =>
      selectedItems.includes(file.path)
    );
  }, [currentDirectory, selectedItems]);

  const hasSelection = selectedItems.length > 0;
  const hasClipboard = clipboard.items.length > 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        {/* Primary Operations */}
        <Button
          disabled={!hasSelection}
          onClick={handleCopy}
          size="sm"
          title="Copy (Ctrl+C)"
          variant="outline"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          disabled={!hasSelection}
          onClick={handleCut}
          size="sm"
          title="Cut (Ctrl+X)"
          variant="outline"
        >
          <Scissors className="h-4 w-4" />
        </Button>

        <Button
          disabled={!hasClipboard}
          onClick={handlePaste}
          size="sm"
          title="Paste (Ctrl+V)"
          variant="outline"
        >
          <ClipboardPaste className="h-4 w-4" />
        </Button>

        <Button
          disabled={!hasSelection}
          onClick={handleDelete}
          size="sm"
          title="Delete (Delete)"
          variant="outline"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          disabled={selectedItems.length !== 1}
          onClick={handleRename}
          size="sm"
          title="Rename (F2)"
          variant="outline"
        >
          <Edit className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* New Items */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" title="New" variant="outline">
              <FilePlus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleNewFolder}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewFile}>
              <FilePlus className="mr-2 h-4 w-4" />
              New File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More Operations */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" title="More operations" variant="outline">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!hasSelection} onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <CompressionDialog
              currentPath={currentPath}
              files={getSelectedFiles()}
            >
              <DropdownMenuItem
                disabled={!hasSelection}
                onClick={(e) => e.preventDefault()}
              >
                <Archive className="mr-2 h-4 w-4" />
                Compress
              </DropdownMenuItem>
            </CompressionDialog>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Batch Operations */}
        <BatchOperationsDialog
          currentPath={currentPath}
          files={getSelectedFiles()}
        >
          <Button
            aria-label="Batch operations"
            disabled={selectedItems.length < 2}
            size="sm"
            title="Batch operations"
            variant="ghost"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </BatchOperationsDialog>

        {/* Close Button */}
        <Button onClick={onClose} size="sm" variant="ghost">
          ×
        </Button>
      </div>

      {/* New Folder Dialog */}
      <Dialog onOpenChange={setNewFolderDialogOpen} open={newFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                autoFocus
                id="folder-name"
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createNewFolder();
                  }
                }}
                placeholder="Enter folder name"
                value={newItemName}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setNewFolderDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={!newItemName.trim()} onClick={createNewFolder}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New File Dialog */}
      <Dialog onOpenChange={setNewFileDialogOpen} open={newFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-name">File name</Label>
              <Input
                autoFocus
                id="file-name"
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createNewFile();
                  }
                }}
                placeholder="Enter file name"
                value={newItemName}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setNewFileDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={!newItemName.trim()} onClick={createNewFile}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog onOpenChange={setRenameDialogOpen} open={renameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename-name">New name</Label>
              <Input
                autoFocus
                id="rename-name"
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameItem();
                  }
                }}
                placeholder="Enter new name"
                value={newItemName}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setRenameDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={!newItemName.trim()} onClick={renameItem}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        cancelText="Cancel"
        confirmText="Delete"
        description={`Are you sure you want to delete ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete Items"
        variant="destructive"
      />
    </>
  );
}
