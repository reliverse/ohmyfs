import { dirname, join } from "@tauri-apps/api/path";
import { mkdir, readFile, writeFile } from "@tauri-apps/plugin-fs";
import JSZip from "jszip";
import type { FileEntry } from "~/types/file";

// Regex for file extension removal
const FILE_EXTENSION_REGEX = /\.[^/.]+$/;

export interface CompressionOptions {
  level?: number; // 0-9, 0 = no compression, 9 = best compression
  password?: string; // For encrypted archives
  comment?: string; // Archive comment
}

export interface CompressionProgress {
  current: number;
  total: number;
  currentFile?: string;
}

export interface ExtractionOptions {
  password?: string;
  overwrite?: boolean;
}

export interface ExtractionProgress {
  current: number;
  total: number;
  currentFile?: string;
}

// Private utility functions

/**
 * Compress files into a ZIP archive
 */
export async function compressFiles(
  files: FileEntry[],
  outputPath: string,
  options: CompressionOptions = {},
  onProgress?: (progress: CompressionProgress) => void
): Promise<void> {
  const zip = new JSZip();

  // Set compression level
  const compressionLevel = Math.max(0, Math.min(9, options.level ?? 6));

  let processed = 0;
  const total = files.length;

  for (const file of files) {
    try {
      onProgress?.({
        current: processed,
        total,
        currentFile: file.name,
      });

      if (file.isDirectory) {
        // Add empty directory
        zip.folder(file.name);
      } else {
        // Read file content and add to zip
        const content = await readFile(file.path);
        zip.file(file.name, content, {
          compression: compressionLevel > 0 ? "DEFLATE" : "STORE",
          compressionOptions:
            compressionLevel > 0 ? { level: compressionLevel } : undefined,
        });
      }

      processed++;
    } catch (error) {
      console.error(`Failed to add ${file.name} to archive:`, error);
      // Continue with other files
    }
  }

  onProgress?.({
    current: total,
    total,
    currentFile: "Generating archive...",
  });

  // Generate the zip file
  const zipContent = await zip.generateAsync({
    type: "uint8array",
    compression: compressionLevel > 0 ? "DEFLATE" : "STORE",
    compressionOptions:
      compressionLevel > 0 ? { level: compressionLevel } : undefined,
    comment: options.comment,
  });

  // Write to output path
  await writeFile(outputPath, zipContent);

  onProgress?.({
    current: total,
    total,
    currentFile: "Complete",
  });
}

/**
 * Extract a ZIP archive
 */
export async function extractArchive(
  archivePath: string,
  outputDir: string,
  _options: ExtractionOptions = {},
  onProgress?: (progress: ExtractionProgress) => void
): Promise<void> {
  // Read the archive
  const archiveContent = await readFile(archivePath);

  // Load with JSZip
  const zip = await JSZip.loadAsync(archiveContent);

  // Get all files
  const files = Object.keys(zip.files);
  let processed = 0;
  const total = files.length;

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  for (const fileName of files) {
    const zipEntry = zip.files[fileName];

    onProgress?.({
      current: processed,
      total,
      currentFile: fileName,
    });

    if (zipEntry.dir) {
      // Create directory
      const fullPath = await join(outputDir, fileName);
      await mkdir(fullPath, { recursive: true });
    } else {
      // Extract file
      const content = await zipEntry.async("uint8array");
      const fullPath = await join(outputDir, fileName);

      // Ensure parent directory exists
      const parentDir = await dirname(fullPath);
      await mkdir(parentDir, { recursive: true });

      await writeFile(fullPath, content);
    }

    processed++;
  }

  onProgress?.({
    current: total,
    total,
    currentFile: "Complete",
  });
}

/**
 * Get archive information
 */
export async function getArchiveInfo(archivePath: string): Promise<{
  files: Array<{
    name: string;
    size: number;
    compressedSize: number;
    isDirectory: boolean;
    date: Date;
  }>;
  totalSize: number;
  compressedSize: number;
  fileCount: number;
}> {
  const archiveContent = await readFile(archivePath);
  const zip = await JSZip.loadAsync(archiveContent);

  const files: Array<{
    name: string;
    size: number;
    compressedSize: number;
    isDirectory: boolean;
    date: Date;
  }> = [];
  let totalSize = 0;
  let compressedSize = 0;
  let fileCount = 0;

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) {
      files.push({
        name,
        size: 0,
        compressedSize: 0,
        isDirectory: true,
        date: entry.date,
      });
    } else {
      const uncompressedSize = 0; // JSZip doesn't provide uncompressed size directly
      const compressedSize_entry = 0; // JSZip doesn't provide compressed size directly

      files.push({
        name,
        size: uncompressedSize,
        compressedSize: compressedSize_entry,
        isDirectory: false,
        date: entry.date,
      });

      totalSize += uncompressedSize;
      compressedSize += compressedSize_entry;
      fileCount++;
    }
  }

  return {
    files,
    totalSize,
    compressedSize,
    fileCount,
  };
}

/**
 * Check if a file is a supported archive
 */
export function isSupportedArchive(fileName: string): boolean {
  const supportedExtensions = [".zip", ".jar", ".war", ".ear"];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  return supportedExtensions.includes(ext);
}

// Utility functions for common operations
export async function compressToZip(
  files: FileEntry[],
  outputPath: string,
  onProgress?: (progress: CompressionProgress) => void
): Promise<void> {
  return await compressFiles(files, outputPath, { level: 6 }, onProgress);
}

export async function extractZip(
  archivePath: string,
  outputDir: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<void> {
  return await extractArchive(archivePath, outputDir, {}, onProgress);
}

export function getSuggestedArchiveName(files: FileEntry[]): string {
  if (files.length === 1) {
    const file = files[0];
    const nameWithoutExt = file.name.replace(FILE_EXTENSION_REGEX, "");
    return `${nameWithoutExt}.zip`;
  }
  return "archive.zip";
}

export function formatCompressionRatio(
  originalSize: number,
  compressedSize: number
): string {
  if (originalSize === 0) {
    return "0%";
  }
  const ratio = ((originalSize - compressedSize) / originalSize) * 100;
  return `${ratio.toFixed(1)}%`;
}

// Utility functions are already exported above
