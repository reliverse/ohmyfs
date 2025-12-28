/**
 * Safety checks and validations for filesystem operations
 */

import type { FileSystemChange } from "~/types/filesystem-engine";

/**
 * Critical paths that should never be modified
 */
export const CRITICAL_PATHS = [
  "/", // Root directory
  "/bin",
  "/sbin",
  "/usr",
  "/etc",
  "/var",
  "/sys",
  "/proc",
  "/dev", // Unix system directories
  "/boot",
  "/lib",
  "/lib64",
  "/opt",
  "/root", // Additional system directories
  "C:\\",
  "C:\\Windows",
  "C:\\Windows\\System32",
  "C:\\Windows\\SysWOW64",
  "C:\\Program Files",
  "C:\\Program Files (x86)", // Windows system directories
];

/**
 * User directories that are safe to modify
 */
export const SAFE_USER_PATHS = ["/home", "/Users", "C:\\Users"];

/**
 * File extensions that are dangerous to modify
 */
export const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".dll",
  ".so",
  ".dylib", // Executables and libraries
  ".sys",
  ".drv", // System files
  ".key",
  ".pem",
  ".crt", // Cryptographic keys
];

/**
 * Check if a path is considered critical/safe to modify
 */
export function isCriticalPath(path: string): boolean {
  const normalizedPath = path.toLowerCase().replace(/\\/g, "/");

  // Allow operations in user directories
  const isInUserDirectory = SAFE_USER_PATHS.some((userPath) => {
    const normalizedUserPath = userPath.toLowerCase().replace(/\\/g, "/");
    return normalizedPath.startsWith(normalizedUserPath);
  });

  if (isInUserDirectory) {
    return false; // Allow operations in user directories
  }

  return CRITICAL_PATHS.some((criticalPath) => {
    const normalizedCritical = criticalPath.toLowerCase().replace(/\\/g, "/");
    return normalizedPath.startsWith(normalizedCritical);
  });
}

/**
 * Check if a file extension is dangerous to modify
 */
export function isDangerousExtension(filename: string): boolean {
  const extension = filename.toLowerCase().split(".").pop();
  return extension ? DANGEROUS_EXTENSIONS.includes(`.${extension}`) : false;
}

/**
 * Check if a path represents a dangerous file operation
 * This is more restrictive than just checking extensions
 */
export function isDangerousFileOperation(
  path: string,
  operation: string
): boolean {
  // Only block dangerous operations on actual dangerous files
  // Don't block operations just because the path contains a dangerous extension
  if (isDangerousExtension(path)) {
    // For create/modify operations on dangerous files, be more restrictive
    if (operation.includes("create") || operation.includes("update")) {
      return true;
    }
    // For remove operations on dangerous files, allow in user directories
    if (operation.includes("remove")) {
      return isCriticalPath(path); // Only block removal in critical paths
    }
  }

  return false;
}

/**
 * Validate a set of changes for safety
 */
export interface SafetyValidation {
  isSafe: boolean;
  errors: string[];
  warnings: string[];
  blockedChanges: FileSystemChange[];
}

/**
 * Validate changes for safety
 */
export function validateChangesSafety(
  changes: FileSystemChange[]
): SafetyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blockedChanges: FileSystemChange[] = [];

  for (const change of changes) {
    // Check for critical path modifications
    if (isCriticalPath(change.path)) {
      errors.push(`Critical system path modification blocked: ${change.path}`);
      blockedChanges.push(change);
      continue;
    }

    // Check for dangerous file operations
    if (isDangerousFileOperation(change.path, change.type)) {
      errors.push(`Dangerous file operation blocked: ${change.path}`);
      blockedChanges.push(change);
      continue;
    }

    // Warn about destructive operations in user directories
    if (change.isDestructive && !isCriticalPath(change.path)) {
      warnings.push(`Destructive operation: ${change.description}`);
    }

    // Warn about operations on hidden files
    if (change.path.includes("/.") || change.path.includes("\\.")) {
      warnings.push(`Hidden file/directory operation: ${change.path}`);
    }

    // Warn about directory removal (be more careful)
    if (change.type === "remove_directory") {
      // Only warn for directory removal, don't block in user directories
      warnings.push(
        `Directory removal: ${change.path} (ensure backup if needed)`
      );
    }
  }

  return {
    isSafe: errors.length === 0,
    errors,
    warnings,
    blockedChanges,
  };
}

/**
 * Get a safety score for changes (0-100, higher is safer)
 */
export function calculateSafetyScore(changes: FileSystemChange[]): number {
  if (changes.length === 0) {
    return 100;
  }

  let score = 100;

  // Deduct points for each issue
  for (const change of changes) {
    if (change.isDestructive) {
      score -= 20;
    }
    if ((change.warnings?.length || 0) > 0) {
      score -= 5;
    }
    if ((change.errors?.length || 0) > 0) {
      score -= 50;
    }
    if (isCriticalPath(change.path)) {
      score -= 100;
    }
    if (isDangerousFileOperation(change.path, change.type)) {
      score -= 100;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Filter out unsafe changes
 */
export function filterSafeChanges(
  changes: FileSystemChange[]
): FileSystemChange[] {
  return changes.filter(
    (change) =>
      !(isCriticalPath(change.path) || isDangerousExtension(change.path)) &&
      (change.errors?.length || 0) === 0
  );
}
