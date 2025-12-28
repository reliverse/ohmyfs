import type {
  ChangeSummary,
  ChangeType,
  FileEntry,
  FileStructureDefinition,
  FileSystemChange,
  FileSystemDiff,
  ResolvedFileSystemNode,
  VariableValues,
} from "~/types/filesystem-engine";
import { logger } from "~/utils/logger";
import { compareWithFilesystem, resolveDefinition } from "./evaluator";
import { filterIgnoredEntries } from "./ignore-rules";
import { calculateSafetyScore, validateChangesSafety } from "./safety";

/**
 * Generates diffs between desired filesystem state and actual state
 */

/**
 * Generate a complete diff between desired and actual filesystem state
 */
export async function generateDiff(
  definition: FileStructureDefinition,
  variables: VariableValues,
  actualEntries: FileEntry[],
  force = false
): Promise<FileSystemDiff> {
  // Filter actual entries based on ignore patterns
  const filteredActualEntries = filterIgnoredEntries(
    actualEntries,
    definition.ignorePatterns || []
  );

  // Resolve the definition
  const resolved = await resolveDefinition(definition, variables);

  // Compare with actual filesystem
  const comparison = await compareWithFilesystem(
    resolved,
    filteredActualEntries,
    force
  );
  logger.debug(
    `Comparison results: missing=${comparison.missing.length}, extra=${comparison.extra.length}, matching=${comparison.matching.length}, conflicts=${comparison.conflicts.length}`
  );
  logger.debug(
    "Missing items:",
    comparison.missing.map((m) => `${m.type}: ${m.path}`)
  );

  // Generate changes
  const changes = generateChanges(comparison);
  logger.debug(
    `Generated ${changes.length} changes:`,
    changes.map((c) => `${c.type}: ${c.path}`)
  );

  // Calculate summary
  const summary = calculateSummary(changes);

  // Validate safety
  const safetyValidation = validateChangesSafety(changes);
  const safetyScore = calculateSafetyScore(changes);
  logger.debug(
    `Safety validation: ${safetyValidation.blockedChanges.length} blocked, ${safetyValidation.errors.length} errors, ${safetyValidation.warnings.length} warnings`
  );
  if (safetyValidation.blockedChanges.length > 0) {
    logger.debug(
      "Blocked changes:",
      safetyValidation.blockedChanges.map((c) => `${c.type}: ${c.path}`)
    );
  }

  // Assess overall safety (combine our assessment with safety validation)
  const isSafe = assessSafety(changes) && safetyValidation.isSafe;
  const canExecuteResult = canExecute(changes) && safetyValidation.isSafe;

  // Combine warnings and errors
  const warnings = [...generateWarnings(changes), ...safetyValidation.warnings];

  const errors = [...generateErrors(changes), ...safetyValidation.errors];

  return {
    definition,
    variables,
    changes:
      safetyValidation.blockedChanges.length > 0
        ? changes.filter(
            (change) => !safetyValidation.blockedChanges.includes(change)
          )
        : changes,
    summary,
    timestamp: new Date(),
    isSafe,
    canExecute: canExecuteResult,
    warnings,
    errors,
    metadata: {
      safetyScore,
      blockedChangesCount: safetyValidation.blockedChanges.length,
    },
  };
}

/**
 * Generate individual changes from comparison results
 */
function generateChanges(comparison: {
  missing: ResolvedFileSystemNode[];
  extra: FileEntry[];
  matching: ResolvedFileSystemNode[];
  conflicts: Array<{
    desired: ResolvedFileSystemNode;
    actual: FileEntry;
    reason: string;
  }>;
}): FileSystemChange[] {
  const changes: FileSystemChange[] = [];

  // Handle missing items (need to be created)
  for (const missing of comparison.missing) {
    changes.push(createChange(missing));
  }

  // Handle conflicts (need to be updated/recreated)
  for (const conflict of comparison.conflicts) {
    changes.push(createConflictChange(conflict));
  }

  // Handle extra items (could be removed, but be careful)
  for (const extra of comparison.extra) {
    changes.push(createExtraItemChange(extra));
  }

  // Sort changes by dependencies
  return sortChangesByDependencies(changes);
}

/**
 * Create a change for a missing item
 */
function createChange(node: ResolvedFileSystemNode): FileSystemChange {
  let type: ChangeType;
  let description: string;

  switch (node.type) {
    case "directory":
      type = "create_directory";
      description = `Create directory: ${node.name}`;
      break;
    case "file":
      type = "create_file";
      description = `Create file: ${node.name}`;
      break;
    case "symlink":
      type = "create_symlink";
      description = `Create symlink: ${node.name}`;
      break;
    default:
      type = "create_file";
      description = `Create unknown item: ${node.name}`;
      break;
  }

  return {
    id: generateChangeId(node.path, type),
    type,
    path: node.path,
    newState: nodeToFileEntry(node),
    isDestructive: false,
    isSafe: true,
    description,
    reason: node.metadata?.reason || "Required by definition",
    warnings: [],
    errors: [],
  };
}

/**
 * Create a change for a conflict
 */
function createConflictChange(conflict: {
  desired: ResolvedFileSystemNode;
  actual: FileEntry;
  reason: string;
}): FileSystemChange {
  const { desired, actual } = conflict;

  // For conflicts, we need to decide what to do
  // This is a conservative approach - we don't automatically overwrite
  let type: ChangeType;
  let description: string;
  let isSafe: boolean;

  if (desired.type === "file" && actual.isFile) {
    type = "update_file_content";
    description = `Update file content: ${desired.name}`;
    isSafe = false; // Updating file content is potentially destructive
  } else if (desired.type === "directory" && actual.isDirectory) {
    // For directories in force mode, don't remove - just mark as no change
    // The directory exists, which is what we want for bootstrap
    type = "no_change";
    description = `Directory already exists: ${desired.name}`;
    isSafe = true;
  } else {
    // Type mismatch - need to remove and recreate
    type = getRemoveType(actual);
    let itemType: string;
    if (actual.isDirectory) {
      itemType = "directory";
    } else if (actual.isFile) {
      itemType = "file";
    } else {
      itemType = "symlink";
    }
    description = `Replace ${itemType}: ${desired.name}`;
    isSafe = false; // Removing existing items is destructive
  }

  return {
    id: generateChangeId(desired.path, type),
    type,
    path: desired.path,
    oldState: actual,
    newState: nodeToFileEntry(desired),
    isDestructive: true,
    isSafe,
    description,
    reason: conflict.reason,
    warnings: [
      "This change will modify or replace existing filesystem item",
      "Consider backing up important data before proceeding",
    ],
    errors: [],
  };
}

/**
 * Create a change for extra items (items that exist but aren't in the definition)
 */
function createExtraItemChange(extra: FileEntry): FileSystemChange {
  const type = getRemoveType(extra);
  let itemType: string;
  if (extra.isDirectory) {
    itemType = "directory";
  } else if (extra.isFile) {
    itemType = "file";
  } else {
    itemType = "symlink";
  }
  const description = `Remove ${itemType}: ${extra.name}`;

  return {
    id: generateChangeId(extra.path, type),
    type,
    path: extra.path,
    oldState: extra,
    isDestructive: true,
    isSafe: false, // Removing existing items is always potentially unsafe
    description,
    reason: "Item exists in filesystem but is not defined in structure",
    warnings: [
      "This item is not part of the desired structure",
      "Removing it may cause data loss",
      "Consider adding it to ignore patterns if it should be preserved",
    ],
    errors: [],
  };
}

/**
 * Get the appropriate remove change type for a file entry
 */
function getRemoveType(entry: FileEntry): ChangeType {
  if (entry.isDirectory) {
    return "remove_directory";
  }
  if (entry.isFile) {
    return "remove_file";
  }
  if (entry.isSymlink) {
    return "remove_symlink";
  }
  return "no_change";
}

/**
 * Convert a resolved node to a FileEntry (for newState)
 */
function nodeToFileEntry(node: ResolvedFileSystemNode): FileEntry {
  return {
    name: node.name,
    path: node.path,
    isDirectory: node.type === "directory",
    isFile: node.type === "file",
    isSymlink: node.type === "symlink",
    size: undefined,
    modifiedAt: undefined,
    createdAt: undefined,
    permissions: undefined,
    extension: undefined,
    mimeType: undefined,
    thumbnail: undefined,
    metadata: {
      ...node.metadata,
      resolvedContent: node.resolvedContent,
    },
  };
}

/**
 * Generate a unique ID for a change
 */
function generateChangeId(path: string, type: ChangeType): string {
  return `${type}_${btoa(path).replace(/[^a-zA-Z0-9]/g, "")}`;
}

/**
 * Sort changes by dependencies (directories before files, etc.)
 */
function sortChangesByDependencies(
  changes: FileSystemChange[]
): FileSystemChange[] {
  // Simple sorting: directories first, then files, then symlinks
  // Remove operations before create operations
  return changes.sort((a, b) => {
    // Priority by operation type
    const typePriority = {
      remove_directory: 1,
      remove_file: 2,
      remove_symlink: 3,
      create_directory: 4,
      create_file: 5,
      create_symlink: 6,
      update_file_content: 7,
      update_permissions: 8,
      no_change: 9,
    };

    const aPriority = typePriority[a.type] || 9;
    const bPriority = typePriority[b.type] || 9;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Then by path length (parent directories first)
    return a.path.length - b.path.length;
  });
}

/**
 * Calculate summary statistics
 */
function calculateSummary(changes: FileSystemChange[]): ChangeSummary {
  const counts = {
    total: changes.length,
    create: 0,
    update: 0,
    remove: 0,
    destructive: 0,
    safe: 0,
    warnings: 0,
    errors: 0,
  };

  for (const change of changes) {
    // Count by operation type
    if (change.type.startsWith("create_")) {
      counts.create++;
    } else if (change.type.startsWith("update_")) {
      counts.update++;
    } else if (change.type.startsWith("remove_")) {
      counts.remove++;
    }

    // Count safety
    if (change.isDestructive) {
      counts.destructive++;
    }
    if (change.isSafe) {
      counts.safe++;
    }

    // Count issues
    counts.warnings += change.warnings?.length || 0;
    counts.errors += change.errors?.length || 0;
  }

  return counts;
}

/**
 * Assess overall safety of the diff
 */
function assessSafety(changes: FileSystemChange[]): boolean {
  // Consider safe if no destructive changes or warnings/errors
  return changes.every(
    (change) =>
      !change.isDestructive &&
      (change.warnings?.length || 0) === 0 &&
      (change.errors?.length || 0) === 0
  );
}

/**
 * Check if the diff can be executed
 */
function canExecute(changes: FileSystemChange[]): boolean {
  // Can execute if no errors and at least one change
  return (
    changes.length > 0 &&
    changes.every((change) => (change.errors?.length || 0) === 0)
  );
}

/**
 * Generate warnings for the diff
 */
function generateWarnings(changes: FileSystemChange[]): string[] {
  const warnings: string[] = [];

  for (const change of changes) {
    if (change.warnings) {
      warnings.push(...change.warnings);
    }
  }

  // Remove duplicates
  return [...new Set(warnings)];
}

/**
 * Generate errors for the diff
 */
function generateErrors(changes: FileSystemChange[]): string[] {
  const errors: string[] = [];

  for (const change of changes) {
    if (change.errors) {
      errors.push(...change.errors);
    }
  }

  // Remove duplicates
  return [...new Set(errors)];
}
