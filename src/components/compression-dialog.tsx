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
import { Slider } from "~/components/ui/slider";
import { Textarea } from "~/components/ui/textarea";
import { useFileManagerActions } from "~/contexts/file-manager-context";
import { useFileOperations } from "~/hooks/use-file-system";
import type { FileEntry } from "~/types/file";
import {
  type CompressionProgress,
  compressFiles,
  getSuggestedArchiveName,
} from "~/utils/compression";

interface CompressionDialogProps {
  files: FileEntry[];
  currentPath: string;
  children: React.ReactNode;
}

export function CompressionDialog({
  files,
  currentPath,
  children,
}: CompressionDialogProps) {
  const [open, setOpen] = useState(false);
  const [archiveName, setArchiveName] = useState("");
  const [compressionLevel, setCompressionLevel] = useState([6]);
  const [archiveComment, setArchiveComment] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFileOperations();
  const { addOperation, updateOperation, removeOperation } =
    useFileManagerActions();

  const resetDialog = useCallback(() => {
    setArchiveName(getSuggestedArchiveName(files));
    setCompressionLevel([6]);
    setArchiveComment("");
    setIsCompressing(false);
    setProgress(null);
    setError(null);
  }, [files]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen) {
        resetDialog();
      }
    },
    [resetDialog]
  );

  const handleCompress = useCallback(async () => {
    if (!archiveName.trim()) {
      return;
    }

    setIsCompressing(true);
    setError(null);

    try {
      // Create operation
      const opId = `compress-${Date.now()}`;
      addOperation({
        id: opId,
        type: "compress",
        source: files.map((f) => f.path),
        destination: currentPath,
        progress: 0,
        status: "running",
        startTime: new Date(),
      });

      // Perform compression
      const outputPath = `${currentPath}/${archiveName.trim()}`;
      await compressFiles(
        files,
        outputPath,
        {
          level: compressionLevel[0],
          comment: archiveComment.trim() || undefined,
        },
        (progressUpdate: CompressionProgress) => {
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
        err instanceof Error ? err.message : "Compression failed";
      setError(errorMessage);

      // Mark operation as failed
      updateOperation(`compress-${Date.now()}`, {
        status: "failed",
        error: errorMessage,
        endTime: new Date(),
      });
    } finally {
      setIsCompressing(false);
    }
  }, [
    archiveName,
    compressionLevel,
    archiveComment,
    files,
    currentPath,
    addOperation,
    updateOperation,
    removeOperation,
  ]);

  const getCompressionLevelText = (level: number) => {
    switch (level) {
      case 0:
        return "No compression (fastest)";
      case 1:
        return "Fastest compression";
      case 6:
        return "Balanced (recommended)";
      case 9:
        return "Best compression (slowest)";
      default:
        return `Level ${level}`;
    }
  };

  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Create ZIP Archive
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Files to compress */}
          <div>
            <Label className="font-medium text-sm">Files to compress</Label>
            <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
              {files.map((file) => (
                <div
                  className="flex items-center gap-2 text-sm"
                  key={file.path}
                >
                  {file.isDirectory ? (
                    <FolderIcon className="h-4 w-4 text-blue-500" />
                  ) : (
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate">{file.name}</span>
                  {file.size && (
                    <Badge className="ml-auto text-xs" variant="outline">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-muted-foreground text-xs">
              {files.length} item{files.length !== 1 ? "s" : ""} • Total:{" "}
              {(totalSize / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>

          <Separator />

          {/* Archive settings */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="archive-name">Archive name</Label>
              <Input
                disabled={isCompressing}
                id="archive-name"
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="archive.zip"
                value={archiveName}
              />
            </div>

            <div className="space-y-2">
              <Label>Compression level</Label>
              <div className="space-y-2">
                <Slider
                  className="w-full"
                  disabled={isCompressing}
                  max={9}
                  min={0}
                  onValueChange={(value) =>
                    setCompressionLevel(Array.isArray(value) ? value : [value])
                  }
                  step={1}
                  value={compressionLevel}
                />
                <div className="text-center text-muted-foreground text-xs">
                  {getCompressionLevelText(compressionLevel[0])}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archive-comment">Comment (optional)</Label>
            <Textarea
              disabled={isCompressing}
              id="archive-comment"
              onChange={(e) => setArchiveComment(e.target.value)}
              placeholder="Add a comment to the archive..."
              rows={2}
              value={archiveComment}
            />
          </div>

          {/* Progress */}
          {isCompressing && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Compressing...</span>
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
              disabled={isCompressing}
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!archiveName.trim() || isCompressing}
              onClick={handleCompress}
            >
              {isCompressing ? "Compressing..." : "Create Archive"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
