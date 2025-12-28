import { Copy, Edit, FileText, Move, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useFileManagerActions } from "~/contexts/file-manager-context";
import { useFileOperations } from "~/hooks/use-file-system";
import type { FileEntry } from "~/types/file";

interface BatchOperationsDialogProps {
  files: FileEntry[];
  currentPath: string;
  children: React.ReactNode;
}

type BatchOperation = "rename" | "move" | "copy" | "delete";

interface RenamePattern {
  find: string;
  replace: string;
  useRegex: boolean;
  caseSensitive: boolean;
}

const applyRegexReplacement = (
  fileName: string,
  pattern: RenamePattern
): string => {
  try {
    const flags = pattern.caseSensitive ? "g" : "gi";
    const regex = new RegExp(pattern.find, flags);
    return fileName.replace(regex, pattern.replace);
  } catch (_error) {
    // Invalid regex, keep original name
    return fileName;
  }
};

const applySimpleReplacement = (
  fileName: string,
  pattern: RenamePattern
): string => {
  const searchStr = pattern.caseSensitive
    ? pattern.find
    : pattern.find.toLowerCase();
  const replaceStr = pattern.replace;
  const normalizedName = pattern.caseSensitive
    ? fileName
    : fileName.toLowerCase();

  if (normalizedName.includes(searchStr)) {
    const index = normalizedName.indexOf(searchStr);
    return (
      fileName.substring(0, index) +
      replaceStr +
      fileName.substring(index + pattern.find.length)
    );
  }
  return fileName;
};

const createExecuteOperation = (
  operation: BatchOperation,
  destinationPath: string,
  renamePattern: RenamePattern,
  previewResults: Array<{ oldName: string; newName: string }>,
  currentPath: string,
  copy: (sources: string[], destination: string) => Promise<void>,
  deleteFiles: (paths: string[]) => Promise<void>,
  rename: (source: string, destination: string) => Promise<void>
) => {
  const executeCopyOperation = async (file: FileEntry) => {
    if (destinationPath) {
      await copy([file.path], destinationPath);
    }
  };

  const executeMoveOperation = async (file: FileEntry) => {
    if (destinationPath) {
      await copy([file.path], destinationPath);
      await deleteFiles([file.path]);
    }
  };

  const executeDeleteOperation = async (file: FileEntry) => {
    await deleteFiles([file.path]);
  };

  const executeRenameOperation = async (file: FileEntry) => {
    if (!renamePattern.find) {
      return;
    }

    const result = previewResults.find((r) => r.oldName === file.name);
    if (result && result.newName !== file.name) {
      const newPath = `${currentPath}/${result.newName}`;
      await rename(file.path, newPath);
    }
  };

  return async (file: FileEntry) => {
    switch (operation) {
      case "copy":
        await executeCopyOperation(file);
        break;
      case "move":
        await executeMoveOperation(file);
        break;
      case "delete":
        await executeDeleteOperation(file);
        break;
      case "rename":
        await executeRenameOperation(file);
        break;
      default:
        break;
    }
  };
};

export function BatchOperationsDialog({
  files,
  currentPath,
  children,
}: BatchOperationsDialogProps) {
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<BatchOperation>("rename");
  const [destinationPath, setDestinationPath] = useState("");
  const [renamePattern, setRenamePattern] = useState<RenamePattern>({
    find: "",
    replace: "",
    useRegex: false,
    caseSensitive: false,
  });
  const [previewResults, setPreviewResults] = useState<
    Array<{ oldName: string; newName: string }>
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    copy: copyMutation,
    rename: renameMutation,
    delete: deleteMutation,
  } = useFileOperations();

  // Create wrapper functions with the expected signatures
  const copy = useCallback(
    async (sources: string[], destination: string) => {
      await copyMutation({ source: sources, destination });
    },
    [copyMutation]
  );
  const deleteFiles = useCallback(
    async (paths: string[]) => {
      await deleteMutation({ paths });
    },
    [deleteMutation]
  );
  const rename = useCallback(
    async (source: string, destination: string) => {
      await renameMutation({ oldPath: source, newPath: destination });
    },
    [renameMutation]
  );
  const { clearSelection, addOperation, updateOperation, removeOperation } =
    useFileManagerActions();

  const resetDialog = useCallback(() => {
    setOperation("rename");
    setDestinationPath("");
    setRenamePattern({
      find: "",
      replace: "",
      useRegex: false,
      caseSensitive: false,
    });
    setPreviewResults([]);
    setIsProcessing(false);
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen) {
        resetDialog();
      }
    },
    [resetDialog]
  );

  const generateRenamePreview = useCallback(() => {
    const results = files.map((file) => {
      if (!renamePattern.find) {
        return {
          oldName: file.name,
          newName: file.name,
        };
      }

      const newName = renamePattern.useRegex
        ? applyRegexReplacement(file.name, renamePattern)
        : applySimpleReplacement(file.name, renamePattern);

      return {
        oldName: file.name,
        newName: newName || file.name,
      };
    });

    setPreviewResults(results);
  }, [files, renamePattern]);

  const handleExecute = useCallback(async () => {
    setIsProcessing(true);

    try {
      const opId = `batch-${operation}-${Date.now()}`;

      addOperation({
        id: opId,
        type: operation,
        source: files.map((f) => f.path),
        destination:
          operation === "move" || operation === "copy"
            ? destinationPath
            : undefined,
        progress: 0,
        status: "running",
        startTime: new Date(),
      });

      let completed = 0;
      const total = files.length;
      const executeOperation = createExecuteOperation(
        operation,
        destinationPath,
        renamePattern,
        previewResults,
        currentPath,
        copy,
        deleteFiles,
        rename
      );

      for (const file of files) {
        try {
          await executeOperation(file);
          completed++;
          updateOperation(opId, {
            progress: (completed / total) * 100,
          });
        } catch (error) {
          console.error(`Failed to ${operation} ${file.name}:`, error);
        }
      }

      updateOperation(opId, {
        status: "completed",
        progress: 100,
        endTime: new Date(),
      });

      clearSelection();
      setOpen(false);

      setTimeout(() => removeOperation(opId), 1000);
    } catch (error) {
      console.error("Batch operation failed:", error);
      updateOperation(`batch-${operation}-${Date.now()}`, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        endTime: new Date(),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    operation,
    files,
    destinationPath,
    renamePattern,
    previewResults,
    currentPath,
    addOperation,
    updateOperation,
    removeOperation,
    clearSelection,
    copy,
    deleteFiles,
    rename,
  ]);

  const getOperationIcon = () => {
    switch (operation) {
      case "copy":
        return <Copy className="h-4 w-4" />;
      case "move":
        return <Move className="h-4 w-4" />;
      case "rename":
        return <Edit className="h-4 w-4" />;
      case "delete":
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getOperationTitle = () => {
    switch (operation) {
      case "copy":
        return "Copy Files";
      case "move":
        return "Move Files";
      case "rename":
        return "Rename Files";
      case "delete":
        return "Delete Files";
      default:
        return "Batch Operation";
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getOperationIcon()}
            {getOperationTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Files summary */}
          <div>
            <Label className="font-medium text-sm">Selected files</Label>
            <div className="mt-2 rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-sm">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </span>
                <Badge variant="outline">
                  {(
                    files.reduce((sum, f) => sum + (f.size || 0), 0) /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB total
                </Badge>
              </div>
            </div>
          </div>

          {/* Operation selection */}
          <div className="space-y-2">
            <Label>Operation</Label>
            <Select
              onValueChange={(value) => setOperation(value as BatchOperation)}
              value={operation}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rename">Rename</SelectItem>
                <SelectItem value="copy">Copy</SelectItem>
                <SelectItem value="move">Move</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operation-specific settings */}
          {(operation === "copy" || operation === "move") && (
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                onChange={(e) => setDestinationPath(e.target.value)}
                placeholder="Enter destination path"
                value={destinationPath}
              />
            </div>
          )}

          {operation === "rename" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="find">Find</Label>
                  <Input
                    id="find"
                    onChange={(e) =>
                      setRenamePattern((prev) => ({
                        ...prev,
                        find: e.target.value,
                      }))
                    }
                    placeholder="Text to find"
                    value={renamePattern.find}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replace">Replace with</Label>
                  <Input
                    id="replace"
                    onChange={(e) =>
                      setRenamePattern((prev) => ({
                        ...prev,
                        replace: e.target.value,
                      }))
                    }
                    placeholder="Replacement text"
                    value={renamePattern.replace}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={renamePattern.useRegex}
                    id="regex"
                    onCheckedChange={(checked) =>
                      setRenamePattern((prev) => ({
                        ...prev,
                        useRegex: !!checked,
                      }))
                    }
                  />
                  <Label className="text-sm" htmlFor="regex">
                    Use regex
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={renamePattern.caseSensitive}
                    id="case-sensitive"
                    onCheckedChange={(checked) =>
                      setRenamePattern((prev) => ({
                        ...prev,
                        caseSensitive: !!checked,
                      }))
                    }
                  />
                  <Label className="text-sm" htmlFor="case-sensitive">
                    Case sensitive
                  </Label>
                </div>
                <Button
                  onClick={generateRenamePreview}
                  size="sm"
                  variant="outline"
                >
                  Preview
                </Button>
              </div>

              {/* Rename preview */}
              {previewResults.length > 0 && (
                <div>
                  <Label className="text-sm">Preview</Label>
                  <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded border bg-muted/30 p-2">
                    {previewResults.slice(0, 10).map((result, _index) => (
                      <div
                        className="flex justify-between text-sm"
                        key={`${result.oldName}-${result.newName}`}
                      >
                        <span className="max-w-[45%] truncate">
                          {result.oldName}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="max-w-[45%] truncate text-right">
                          {result.newName}
                        </span>
                      </div>
                    ))}
                    {previewResults.length > 10 && (
                      <div className="pt-1 text-center text-muted-foreground text-xs">
                        ... and {previewResults.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              disabled={isProcessing}
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                isProcessing ||
                (operation === "rename" && !renamePattern.find) ||
                ((operation === "copy" || operation === "move") &&
                  !destinationPath.trim())
              }
              onClick={handleExecute}
            >
              {isProcessing ? "Processing..." : `Execute ${operation}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
