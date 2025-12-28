import { readFile } from "@tauri-apps/plugin-fs";
import {
  Archive,
  FileIcon,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import type { FileEntry } from "~/types/file";
import {
  isArchiveFile,
  isAudioFile,
  isImageFile,
  isTextFile,
  isVideoFile,
} from "~/utils/file-system";

interface FilePreviewProps {
  file: FileEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const loadImagePreview = async (
  file: FileEntry,
  setImageUrl: (url: string) => void
) => {
  const content = await readFile(file.path);
  const blob = new Blob([content], {
    type: file.mimeType || "image/jpeg",
  });
  const url = URL.createObjectURL(blob);
  setImageUrl(url);
};

const loadTextPreview = async (
  file: FileEntry,
  setPreviewContent: (content: string) => void
) => {
  try {
    const content = await readFile(file.path);
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(content.slice(0, 10_240)); // 10KB limit
    setPreviewContent(text);
  } catch (_error) {
    setPreviewContent("Error loading text preview");
  }
};

const loadVideoPreview = (setPreviewContent: (content: string) => void) => {
  setPreviewContent("Video file - preview not available");
};

const loadAudioPreview = (setPreviewContent: (content: string) => void) => {
  setPreviewContent("Audio file - preview not available");
};

const loadUnsupportedPreview = (
  setPreviewContent: (content: string) => void
) => {
  setPreviewContent("Preview not available for this file type");
};

export function FilePreview({ file, open, onOpenChange }: FilePreviewProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    setError(null);
    setPreviewContent(null);
    setImageUrl(null);

    try {
      const extension = file.extension || "";

      switch (true) {
        case isImageFile(extension):
          await loadImagePreview(file, setImageUrl);
          break;
        case isTextFile(extension):
          await loadTextPreview(file, setPreviewContent);
          break;
        case isVideoFile(extension):
          loadVideoPreview(setPreviewContent);
          break;
        case isAudioFile(extension):
          loadAudioPreview(setPreviewContent);
          break;
        default:
          loadUnsupportedPreview(setPreviewContent);
          break;
      }
    } catch (err) {
      setError(
        `Failed to load preview: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }, [file]);

  useEffect(() => {
    if (open && file) {
      // Lazy load: wait 300ms before loading preview to improve perceived performance
      const timer = setTimeout(() => {
        loadPreview();
        setHasLoaded(true);
      }, 300);

      return () => clearTimeout(timer);
    }
    // Reset state when dialog closes
    setPreviewContent(null);
    setImageUrl(null);
    setLoading(false);
    setError(null);
    setHasLoaded(false);
  }, [open, file, loadPreview]);

  // Cleanup image URL on unmount or file change
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const getFileType = (extension: string) => {
    if (isImageFile(extension)) {
      return "image";
    }
    if (isVideoFile(extension)) {
      return "video";
    }
    if (isAudioFile(extension)) {
      return "audio";
    }
    if (isTextFile(extension)) {
      return "text";
    }
    if (isArchiveFile(extension)) {
      return "archive";
    }
    return "unknown";
  };

  const getFileIcon = () => {
    if (!file) {
      return <FileIcon className="h-8 w-8" />;
    }

    const extension = file.extension || "";
    const fileType = getFileType(extension);
    const iconProps = "h-8 w-8";

    switch (fileType) {
      case "image":
        return <ImageIcon className={`${iconProps} text-green-500`} />;
      case "video":
        return <Video className={`${iconProps} text-red-500`} />;
      case "audio":
        return <Music className={`${iconProps} text-purple-500`} />;
      case "text":
        return <FileText className={`${iconProps} text-blue-500`} />;
      case "archive":
        return <Archive className={`${iconProps} text-yellow-500`} />;
      default:
        return <FileIcon className={`${iconProps} text-gray-500`} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return "0 B";
    }
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  if (!file) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            <span className="truncate">{file.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="flex min-h-[300px] items-center justify-center rounded-lg border bg-muted/30 p-4">
              {!hasLoaded && (
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Preparing preview...</p>
                </div>
              )}
              {hasLoaded && loading && (
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading preview...</p>
                </div>
              )}
              {hasLoaded && !loading && error && (
                <div className="text-center text-destructive">
                  <X className="mx-auto mb-2 h-8 w-8" />
                  <p>{error}</p>
                </div>
              )}
              {hasLoaded && !loading && !error && imageUrl && (
                <img
                  alt={file.name}
                  className="max-h-[400px] max-w-full rounded object-contain"
                  height="auto"
                  loading="lazy"
                  src={imageUrl}
                  width="auto"
                />
              )}
              {hasLoaded &&
                !loading &&
                !error &&
                !imageUrl &&
                previewContent && (
                  <ScrollArea className="h-[400px] w-full">
                    <pre className="whitespace-pre-wrap p-2 font-mono text-sm">
                      {previewContent}
                    </pre>
                  </ScrollArea>
                )}
              {hasLoaded &&
                !loading &&
                !error &&
                !imageUrl &&
                !previewContent && (
                  <div className="text-center text-muted-foreground">
                    {getFileIcon()}
                    <p className="mt-2">No preview available</p>
                  </div>
                )}
            </div>
          </div>

          {/* File Information */}
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">File Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 truncate">{file.name}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2">
                    {file.isDirectory ? "Folder" : file.mimeType || "Unknown"}
                  </span>
                </div>

                {file.extension && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extension:</span>
                    <Badge className="ml-2" variant="outline">
                      .{file.extension}
                    </Badge>
                  </div>
                )}

                {file.size !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="ml-2">{formatFileSize(file.size)}</span>
                  </div>
                )}

                {file.modifiedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modified:</span>
                    <span className="ml-2 text-right">
                      {formatDate(file.modifiedAt)}
                    </span>
                  </div>
                )}

                {file.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 text-right">
                      {formatDate(file.createdAt)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Path:</span>
                  <span className="ml-2 break-all text-right text-xs">
                    {file.path}
                  </span>
                </div>

                {file.permissions && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Permissions:</span>
                    <span className="ml-2 font-mono text-xs">
                      {file.permissions}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" size="sm" variant="outline">
                Open
              </Button>
              <Button className="flex-1" size="sm" variant="outline">
                Open With
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
