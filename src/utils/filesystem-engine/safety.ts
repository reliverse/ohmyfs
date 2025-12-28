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
  "C:\\",
  "C:\\Windows",
  "C:\\Program Files",
  "C:\\Program Files (x86)", // Windows system directories
];

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

    // Check for dangerous file extensions
    if (isDangerousExtension(change.path)) {
      errors.push(`Dangerous file type modification blocked: ${change.path}`);
      blockedChanges.push(change);
      continue;
    }

    // Warn about destructive operations
    if (change.isDestructive) {
      warnings.push(`Destructive operation: ${change.description}`);
    }

    // Warn about operations on hidden files
    if (change.path.includes("/.") || change.path.includes("\\.")) {
      warnings.push(`Hidden file/directory operation: ${change.path}`);
    }

    // Warn about large directories
    if (change.type === "remove_directory") {
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
    if (isDangerousExtension(change.path)) {
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
