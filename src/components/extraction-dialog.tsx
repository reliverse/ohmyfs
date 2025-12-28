import { Archive, FileIcon, FolderIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { useFileManagerActions } from "~/contexts/file-manager-context";
import { useFileOperations } from "~/hooks/use-file-system";
import type { FileEntry } from "~/types/file";
import {
  type ExtractionProgress,
  extractArchive,
  getArchiveInfo,
} from "~/utils/compression";

const EXTENSION_REGEX = /\.[^/.]+$/;

interface ExtractionDialogProps {
  file: FileEntry;
  currentPath: string;
  children: React.ReactNode;
}

export function ExtractionDialog({
  file,
  currentPath,
  children,
}: ExtractionDialogProps) {
  const [open, setOpen] = useState(false);
  const [outputPath, setOutputPath] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [archiveInfo, setArchiveInfo] = useState<Awaited<
    ReturnType<typeof getArchiveInfo>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { createDirectory } = useFileOperations();
  const { addOperation, updateOperation, removeOperation } =
    useFileManagerActions();

  const resetDialog = useCallback(() => {
    const suggestedOutputPath = `${currentPath}/${file.name.replace(EXTENSION_REGEX, "")}`;
    setOutputPath(suggestedOutputPath);
    setIsExtracting(false);
    setProgress(null);
    setArchiveInfo(null);
    setError(null);
  }, [currentPath, file.name]);

  const handleOpenChange = useCallback(
    async (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen) {
        resetDialog();
        // Load archive information
        try {
          const info = await getArchiveInfo(file.path);
          setArchiveInfo(info);
        } catch (_err) {
          setError("Failed to read archive information");
        }
      }
    },
    [resetDialog, file.path]
  );

  const handleExtract = useCallback(async () => {
    if (!outputPath.trim()) {
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      // Create operation
      const opId = `extract-${Date.now()}`;
      addOperation({
        id: opId,
        type: "extract",
        source: file.path,
        destination: outputPath.trim(),
        progress: 0,
        status: "running",
        startTime: new Date(),
      });

      // Ensure output directory exists
      await createDirectory({ path: outputPath.trim() });

      // Perform extraction
      await extractArchive(
        file.path,
        outputPath.trim(),
        {},
        (progressUpdate: ExtractionProgress) => {
          setProgress(progressUpdate);
          updateOperation(opId, {
            progress: (progressUpdate.current / progressUpdate.total) * 100,
          });
        }
      );

      // Mark operation as complete
      updateOperation(opId, {
        status: "completed",
        progress: 100,
        endTime: new Date(),
      });

      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false);
        removeOperation(opId);
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Extraction failed";
      setError(errorMessage);

      // Mark operation as failed
      updateOperation(`extract-${Date.now()}`, {
        status: "failed",
        error: errorMessage,
        endTime: new Date(),
      });
    } finally {
      setIsExtracting(false);
    }
  }, [
    outputPath,
    file.path,
    addOperation,
    updateOperation,
    removeOperation,
    createDirectory,
  ]);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Extract Archive
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Archive information */}
          <div>
            <Label className="font-medium text-sm">Archive</Label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border p-3">
              <Archive className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium">{file.name}</div>
                <div className="text-muted-foreground text-sm">
                  {file.size
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                    : "Unknown size"}
                </div>
              </div>
            </div>
          </div>

          {/* Archive contents preview */}
          {archiveInfo && (
            <div>
              <Label className="font-medium text-sm">Contents</Label>
              <div className="mt-2 rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {archiveInfo.fileCount} file
                    {archiveInfo.fileCount !== 1 ? "s" : ""}
                  </span>
                  <Badge variant="outline">
                    {(archiveInfo.totalSize / 1024 / 1024).toFixed(2)} MB
                    uncompressed
                  </Badge>
                </div>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {archiveInfo.files.slice(0, 10).map((archiveFile, _index) => (
                    <div
                      className="flex items-center gap-2 text-sm"
                      key={archiveFile.name}
                    >
                      {archiveFile.isDirectory ? (
                        <FolderIcon className="h-3 w-3 text-blue-500" />
                      ) : (
                        <FileIcon className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="truncate">{archiveFile.name}</span>
                      {!archiveFile.isDirectory && (
                        <Badge className="ml-auto text-xs" variant="outline">
                          {(archiveFile.size / 1024).toFixed(1)} KB
                        </Badge>
                      )}
                    </div>
                  ))}
                  {archiveInfo.files.length > 10 && (
                    <div className="py-1 text-center text-muted-foreground text-xs">
                      ... and {archiveInfo.files.length - 10} more files
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Output settings */}
          <div className="space-y-2">
            <Label htmlFor="output-path">Extract to</Label>
            <Input
              disabled={isExtracting}
              id="output-path"
              onChange={(e) => setOutputPath(e.target.value)}
              placeholder="Select extraction directory"
              value={outputPath}
            />
            <div className="text-muted-foreground text-xs">
              Files will be extracted to this directory
            </div>
          </div>

          {/* Progress */}
          {isExtracting && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Extracting...</span>
                <span>
                  {progress.current}/{progress.total}
                </span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
              {progress.currentFile && (
                <div className="truncate text-muted-foreground text-xs">
                  {progress.currentFile}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              disabled={isExtracting}
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!outputPath.trim() || isExtracting}
              onClick={handleExtract}
            >
              {isExtracting ? "Extracting..." : "Extract Archive"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
