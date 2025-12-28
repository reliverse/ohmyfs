import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  useFileManagerActions,
  useFileManagerState,
} from "~/contexts/file-manager-context";
import type { FileOperation } from "~/types/file";
import {
  copyFileOperation,
  createDirectory,
  deleteFile,
  fileExists,
  getFileStats,
  groupFiles,
  readDirectory,
  renameFile,
  sortFiles,
} from "~/utils/file-system";

export const fileSystemKeys = {
  directory: (path: string) => ["filesystem", "directory", path] as const,
  file: (path: string) => ["filesystem", "file", path] as const,
  stats: (path: string) => ["filesystem", "stats", path] as const,
  exists: (path: string) => ["filesystem", "exists", path] as const,
};

export function useDirectory(
  path: string,
  options?: {
    showHidden?: boolean;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  }
) {
  const {
    showHidden = false,
    enabled = true,
    refetchOnWindowFocus = false,
  } = options || {};
  const { viewMode } = useFileManagerState();

  return useQuery({
    queryKey: fileSystemKeys.directory(path),
    queryFn: async () => {
      try {
        const files = await readDirectory(
          path,
          showHidden || viewMode.showHidden
        );
        const sortedFiles = sortFiles(
          files,
          viewMode.sortBy,
          viewMode.sortOrder
        );
        return {
          files: sortedFiles,
          grouped: groupFiles(sortedFiles, viewMode.groupBy),
          path,
        };
      } catch (error) {
        throw new Error(
          `Failed to read directory: ${path}. ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    enabled: enabled && !!path,
    refetchOnWindowFocus,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFileStats(path: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: fileSystemKeys.stats(path),
    queryFn: () => getFileStats(path),
    enabled: enabled && !!path,
    staleTime: 60_000, // 1 minute
  });
}

export function useFileExists(path: string, options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: fileSystemKeys.exists(path),
    queryFn: () => fileExists(path),
    enabled: enabled && !!path,
    staleTime: 30_000, // 30 seconds
  });
}

export function useFileOperations() {
  const queryClient = useQueryClient();
  const { addOperation, updateOperation } = useFileManagerActions();

  const createOperation = useCallback(
    (
      operation: Omit<FileOperation, "id" | "progress" | "status" | "startTime">
    ) => {
      const op: FileOperation = {
        ...operation,
        id: crypto.randomUUID(),
        progress: 0,
        status: "pending",
        startTime: new Date(),
      };
      addOperation(op);
      return op.id;
    },
    [addOperation]
  );

  const updateOperationStatus = useCallback(
    (
      id: string,
      status: FileOperation["status"],
      progress?: number,
      error?: string
    ) => {
      updateOperation(id, {
        status,
        progress: progress ?? 0,
        error,
        endTime:
          status === "completed" ||
          status === "failed" ||
          status === "cancelled"
            ? new Date()
            : undefined,
      });
    },
    [updateOperation]
  );

  const createDirectoryMutation = useMutation({
    mutationFn: async ({ path }: { path: string }) => {
      const opId = createOperation({
        type: "create",
        source: path,
      });

      try {
        updateOperationStatus(opId, "running", 50);
        await createDirectory(path);
        updateOperationStatus(opId, "completed", 100);

        const parentPath = path.split("/").slice(0, -1).join("/") || "/";
        queryClient.invalidateQueries({
          queryKey: fileSystemKeys.directory(parentPath),
        });

        return { success: true, path };
      } catch (error) {
        updateOperationStatus(opId, "failed", 0, (error as Error).message);
        throw error;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ paths }: { paths: string | string[] }) => {
      const pathArray = Array.isArray(paths) ? paths : [paths];
      const opId = createOperation({
        type: "delete",
        source: pathArray,
      });

      try {
        updateOperationStatus(opId, "running", 50);

        for (const path of pathArray) {
          await deleteFile(path);
        }

        updateOperationStatus(opId, "completed", 100);

        const affectedDirs = new Set(
          pathArray.map((p) => p.split("/").slice(0, -1).join("/") || "/")
        );
        for (const dir of affectedDirs) {
          queryClient.invalidateQueries({
            queryKey: fileSystemKeys.directory(dir),
          });
        }

        return { success: true, paths: pathArray };
      } catch (error) {
        updateOperationStatus(opId, "failed", 0, (error as Error).message);
        throw error;
      }
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({
      oldPath,
      newPath,
    }: {
      oldPath: string;
      newPath: string;
    }) => {
      const opId = createOperation({
        type: "rename",
        source: oldPath,
        destination: newPath,
      });

      try {
        updateOperationStatus(opId, "running", 50);
        await renameFile(oldPath, newPath);
        updateOperationStatus(opId, "completed", 100);

        const oldDir = oldPath.split("/").slice(0, -1).join("/") || "/";
        const newDir = newPath.split("/").slice(0, -1).join("/") || "/";

        queryClient.invalidateQueries({
          queryKey: fileSystemKeys.directory(oldDir),
        });
        if (oldDir !== newDir) {
          queryClient.invalidateQueries({
            queryKey: fileSystemKeys.directory(newDir),
          });
        }

        return { success: true, oldPath, newPath };
      } catch (error) {
        updateOperationStatus(opId, "failed", 0, (error as Error).message);
        throw error;
      }
    },
  });

  const copyMutation = useMutation({
    mutationFn: async ({
      source,
      destination,
    }: {
      source: string | string[];
      destination: string;
    }) => {
      const sourceArray = Array.isArray(source) ? source : [source];
      const opId = createOperation({
        type: "copy",
        source: sourceArray,
        destination,
      });

      try {
        updateOperationStatus(opId, "running", 50);

        for (const src of sourceArray) {
          const fileName = src.split("/").pop() || "unknown";
          const destPath = `${destination}/${fileName}`;
          await copyFileOperation(src, destPath);
        }

        updateOperationStatus(opId, "completed", 100);

        queryClient.invalidateQueries({
          queryKey: fileSystemKeys.directory(destination),
        });

        return { success: true, source: sourceArray, destination };
      } catch (error) {
        updateOperationStatus(opId, "failed", 0, (error as Error).message);
        throw error;
      }
    },
  });

  return {
    createDirectory: createDirectoryMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    rename: renameMutation.mutateAsync,
    copy: copyMutation.mutateAsync,
    isCreating: createDirectoryMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRenaming: renameMutation.isPending,
    isCopying: copyMutation.isPending,
  };
}

export function useCurrentDirectory() {
  const { currentPath } = useFileManagerState();
  const { setCurrentPath, addRecentItem } = useFileManagerActions();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const navigateTo = useCallback(
    (path: string) => {
      if (path !== currentPath) {
        if (currentPath && historyIndex === history.length - 1) {
          setHistory((prev) => [...prev, currentPath]);
          setHistoryIndex((prev) => prev + 1);
        }

        setCurrentPath(path);
        addRecentItem({
          id: crypto.randomUUID(),
          name: path.split("/").pop() || path,
          path,
          type: "directory",
          accessedAt: new Date(),
        });
      }
    },
    [currentPath, setCurrentPath, addRecentItem, history.length, historyIndex]
  );

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const path = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentPath(path);
    }
  }, [history, historyIndex, setCurrentPath]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const path = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentPath(path);
    }
  }, [history, historyIndex, setCurrentPath]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  useEffect(() => {
    if (currentPath && !history.includes(currentPath)) {
      setHistory([currentPath]);
      setHistoryIndex(0);
    }
  }, [currentPath, history.includes]);

  return {
    currentPath,
    navigateTo,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    history,
  };
}
