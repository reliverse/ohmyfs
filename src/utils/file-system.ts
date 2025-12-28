import { dirname, extname, join, resolve, sep } from "@tauri-apps/api/path";
import {
  copyFile,
  exists,
  mkdir,
  readDir,
  readFile,
  remove,
  rename,
  stat,
  writeFile,
} from "@tauri-apps/plugin-fs";
import type { FileEntry, FileViewMode } from "~/types/file";

// MIME type mapping for common file extensions
const MIME_TYPES: Record<string, string> = {
  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",

  // Videos
  ".mp4": "video/mp4",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".wmv": "video/x-ms-wmv",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",

  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",

  // Documents
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
  ".rtf": "application/rtf",
  ".csv": "text/csv",

  // Archives
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",

  // Code files
  ".js": "application/javascript",
  ".ts": "application/typescript",
  ".jsx": "text/jsx",
  ".tsx": "text/tsx",
  ".html": "text/html",
  ".css": "text/css",
  ".scss": "text/x-scss",
  ".less": "text/x-less",
  ".json": "application/json",
  ".xml": "application/xml",
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
  ".md": "text/markdown",
  ".py": "text/x-python",
  ".java": "text/x-java-source",
  ".c": "text/x-c",
  ".cpp": "text/x-c++",
  ".h": "text/x-c",
  ".hpp": "text/x-c++",
  ".rs": "text/x-rust",
  ".go": "text/x-go",
  ".php": "application/x-php",
  ".rb": "text/x-ruby",
  ".sh": "application/x-shellscript",
  ".bat": "application/x-msdos-program",
  ".ps1": "application/x-powershell",
};

// Regex for Windows drive letters
const WINDOWS_DRIVE_REGEX = /^[A-Za-z]:/;

/**
 * Validates a path to prevent path traversal attacks
 */
export function validatePath(path: string): boolean {
  // Check for path traversal attempts
  if (path.includes("..") || path.includes("../") || path.includes("..\\")) {
    return false;
  }
  // Check for absolute paths on different platforms
  if (
    path.startsWith("/") ||
    path.startsWith("\\") ||
    WINDOWS_DRIVE_REGEX.test(path)
  ) {
    // Allow absolute paths for file system navigation
    return true;
  }
  return true;
}

export function getMimeType(extension: string): string {
  return MIME_TYPES[extension.toLowerCase()] || "application/octet-stream";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(date: Date): string {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export async function readDirectory(
  path: string,
  showHidden = false
): Promise<FileEntry[]> {
  try {
    // Validate path for security
    if (!validatePath(path)) {
      throw new Error(`Invalid path: ${path}`);
    }

    // Resolve the path to handle relative paths properly
    const resolvedPath = await resolve(path);
    const entries = await readDir(resolvedPath);

    const fileEntries: FileEntry[] = [];

    for (const entry of entries) {
      // Skip hidden files if not showing them
      if (!showHidden && entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = await join(resolvedPath, entry.name);
      const stats = await stat(fullPath);

      const extension = await extname(entry.name);
      const fileEntry: FileEntry = {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory,
        isFile: entry.isFile,
        isSymlink: entry.isSymlink,
        size: stats.size,
        modifiedAt: stats.mtime ? new Date(stats.mtime) : undefined,
        createdAt: stats.atime ? new Date(stats.atime) : undefined,
        permissions: stats.mode?.toString(8),
        extension,
        mimeType: getMimeType(extension),
      };

      fileEntries.push(fileEntry);
    }

    return fileEntries;
  } catch (error) {
    console.error("Error reading directory:", error);
    throw new Error(`Failed to read directory: ${path}`);
  }
}

export async function readFileContent(
  path: string,
  encoding: "utf8" | "binary" = "utf8"
): Promise<string | Uint8Array> {
  try {
    // Validate path for security
    if (!validatePath(path)) {
      throw new Error(`Invalid path: ${path}`);
    }

    const resolvedPath = await resolve(path);
    const content = await readFile(resolvedPath);
    if (encoding === "utf8") {
      return new TextDecoder().decode(content);
    }
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error(`Failed to read file: ${path}`);
  }
}

export async function getFileStats(path: string) {
  try {
    // Validate path for security
    if (!validatePath(path)) {
      throw new Error(`Invalid path: ${path}`);
    }

    const resolvedPath = await resolve(path);
    return await stat(resolvedPath);
  } catch (error) {
    console.error("Error getting file stats:", error);
    throw new Error(`Failed to get file stats: ${path}`);
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    // Validate path for security
    if (!validatePath(path)) {
      return false;
    }

    const resolvedPath = await resolve(path);
    return await exists(resolvedPath);
  } catch {
    return false;
  }
}

export async function createDirectory(path: string): Promise<void> {
  try {
    // Validate path for security
    if (!validatePath(path)) {
      throw new Error(`Invalid path: ${path}`);
    }

    const resolvedPath = await resolve(path);
    await mkdir(resolvedPath, { recursive: true });
  } catch (error) {
    console.error("Error creating directory:", error);
    throw new Error(`Failed to create directory: ${path}`);
  }
}

export async function deleteFile(path: string): Promise<void> {
  try {
    // Validate path for security
    if (!validatePath(path)) {
      throw new Error(`Invalid path: ${path}`);
    }

    const resolvedPath = await resolve(path);
    await remove(resolvedPath);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error(`Failed to delete: ${path}`);
  }
}

export async function renameFile(
  oldPath: string,
  newPath: string
): Promise<void> {
  try {
    // Validate paths for security
    if (!(validatePath(oldPath) && validatePath(newPath))) {
      throw new Error(`Invalid path: ${oldPath} or ${newPath}`);
    }

    const resolvedOldPath = await resolve(oldPath);
    const resolvedNewPath = await resolve(newPath);
    await rename(resolvedOldPath, resolvedNewPath);
  } catch (error) {
    console.error("Error renaming file:", error);
    throw new Error(`Failed to rename ${oldPath} to ${newPath}`);
  }
}

export async function copyFileOperation(
  source: string,
  destination: string
): Promise<void> {
  try {
    // Validate paths for security
    if (!(validatePath(source) && validatePath(destination))) {
      throw new Error(`Invalid path: ${source} or ${destination}`);
    }

    const resolvedSource = await resolve(source);
    const resolvedDestination = await resolve(destination);
    await copyFile(resolvedSource, resolvedDestination);
  } catch (error) {
    console.error("Error copying file:", error);
    throw new Error(`Failed to copy ${source} to ${destination}`);
  }
}

export async function writeFileContent(
  path: string,
  content: string | Uint8Array
): Promise<void> {
  try {
    // Validate path for security
    if (!validatePath(path)) {
      throw new Error(`Invalid path: ${path}`);
    }

    const resolvedPath = await resolve(path);
    const data =
      typeof content === "string" ? new TextEncoder().encode(content) : content;
    await writeFile(resolvedPath, data);
  } catch (error) {
    console.error("Error writing file:", error);
    throw new Error(`Failed to write file: ${path}`);
  }
}

// Helper functions to reduce complexity of sortFiles
const getNameComparison = (a: FileEntry, b: FileEntry): number => {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const getSizeComparison = (a: FileEntry, b: FileEntry): number => {
  return (a.size || 0) - (b.size || 0);
};

const getModifiedComparison = (a: FileEntry, b: FileEntry): number => {
  return (a.modifiedAt?.getTime() || 0) - (b.modifiedAt?.getTime() || 0);
};

const getCreatedComparison = (a: FileEntry, b: FileEntry): number => {
  return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
};

const getTypeComparison = (a: FileEntry, b: FileEntry): number => {
  const aExt = a.extension || "";
  const bExt = b.extension || "";

  if (a.isDirectory && !b.isDirectory) {
    return -1;
  }
  if (!a.isDirectory && b.isDirectory) {
    return 1;
  }

  const extComparison = aExt.localeCompare(bExt);
  return extComparison !== 0 ? extComparison : a.name.localeCompare(b.name);
};

const getComparison = (
  a: FileEntry,
  b: FileEntry,
  sortBy: FileViewMode["sortBy"]
): number => {
  switch (sortBy) {
    case "name":
      return getNameComparison(a, b);
    case "size":
      return getSizeComparison(a, b);
    case "modified":
      return getModifiedComparison(a, b);
    case "created":
      return getCreatedComparison(a, b);
    case "type":
      return getTypeComparison(a, b);
    default:
      return getNameComparison(a, b);
  }
};

export function sortFiles(
  files: FileEntry[],
  sortBy: FileViewMode["sortBy"],
  sortOrder: FileViewMode["sortOrder"]
): FileEntry[] {
  return [...files].sort((a, b) => {
    const comparison = getComparison(a, b, sortBy);
    return sortOrder === "desc" ? -comparison : comparison;
  });
}

// Helper functions to reduce complexity of groupFiles
const getTypeGroupKey = (file: FileEntry): string => {
  if (file.isDirectory) {
    return "Folders";
  }
  if (file.extension) {
    return `${file.extension.toUpperCase().slice(1)} Files`;
  }
  return "Files";
};

const getDateGroupKey = (file: FileEntry): string => {
  if (file.modifiedAt) {
    return file.modifiedAt.toDateString();
  }
  return "Unknown Date";
};

const getSizeGroupKey = (file: FileEntry): string => {
  if (file.size === undefined) {
    return "Unknown Size";
  }
  if (file.size < 1024 * 1024) {
    return "Small (< 1MB)";
  }
  if (file.size < 1024 * 1024 * 100) {
    return "Medium (1MB - 100MB)";
  }
  return "Large (> 100MB)";
};

const getGroupKey = (
  file: FileEntry,
  groupBy: FileViewMode["groupBy"]
): string => {
  switch (groupBy) {
    case "type":
      return getTypeGroupKey(file);
    case "date":
      return getDateGroupKey(file);
    case "size":
      return getSizeGroupKey(file);
    default:
      return "Other";
  }
};

export function groupFiles(
  files: FileEntry[],
  groupBy: FileViewMode["groupBy"]
): Record<string, FileEntry[]> {
  if (!groupBy || groupBy === "none") {
    return { "All Files": files };
  }

  const groups: Record<string, FileEntry[]> = {};

  for (const file of files) {
    const groupKey = getGroupKey(file, groupBy);

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(file);
  }

  return groups;
}

export async function getParentDirectories(path: string): Promise<string[]> {
  const parents: string[] = [];
  let current = path;
  const pathSep = await sep();

  while (current !== pathSep) {
    const parent = await dirname(current);
    if (parent === current) {
      break;
    }
    parents.unshift(parent);
    current = parent;
  }

  return parents;
}

export function isImageFile(extension: string): boolean {
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".bmp",
  ];
  return imageExtensions.includes(extension.toLowerCase());
}

export function isVideoFile(extension: string): boolean {
  const videoExtensions = [
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".mkv",
    ".webm",
    ".flv",
    ".m4v",
  ];
  return videoExtensions.includes(extension.toLowerCase());
}

export function isAudioFile(extension: string): boolean {
  const audioExtensions = [
    ".mp3",
    ".wav",
    ".flac",
    ".aac",
    ".ogg",
    ".wma",
    ".m4a",
  ];
  return audioExtensions.includes(extension.toLowerCase());
}

export function isTextFile(extension: string): boolean {
  const textExtensions = [
    ".txt",
    ".md",
    ".json",
    ".xml",
    ".yaml",
    ".yml",
    ".csv",
    ".log",
    ".ini",
    ".cfg",
  ];
  return textExtensions.includes(extension.toLowerCase()) || extension === "";
}

export function isArchiveFile(extension: string): boolean {
  const archiveExtensions = [
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
  ];
  return archiveExtensions.includes(extension.toLowerCase());
}

export function getFileIcon(extension: string, isDirectory: boolean): string {
  if (isDirectory) {
    return "folder";
  }

  const ext = extension.toLowerCase();

  if (isImageFile(ext)) {
    return "image";
  }
  if (isVideoFile(ext)) {
    return "video";
  }
  if (isAudioFile(ext)) {
    return "music";
  }
  if (isTextFile(ext)) {
    return "file-text";
  }
  if (isArchiveFile(ext)) {
    return "archive";
  }

  // Specific file types
  switch (ext) {
    case ".pdf":
      return "file-text";
    case ".doc":
    case ".docx":
      return "file-text";
    case ".xls":
    case ".xlsx":
      return "file-spreadsheet";
    case ".ppt":
    case ".pptx":
      return "presentation";
    case ".js":
    case ".ts":
    case ".jsx":
    case ".tsx":
      return "code";
    case ".html":
    case ".css":
    case ".scss":
    case ".less":
      return "globe";
    case ".exe":
    case ".app":
    case ".dmg":
    case ".deb":
    case ".rpm":
      return "package";
    default:
      return "file";
  }
}
