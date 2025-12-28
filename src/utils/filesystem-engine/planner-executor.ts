import type {
  EngineConfig,
  ExecutionPlan,
  ExecutionResult,
  FileSystemChange,
  FileSystemDiff,
} from "~/types/filesystem-engine";
import {
  createDirectory as createDirectoryUtil,
  deleteFile as deleteFileUtil,
  writeFileContent as writeFileContentUtil,
} from "~/utils/file-system";
import { logger } from "~/utils/logger";

/**
 * Plans and executes filesystem changes
 */

/**
 * Create an execution plan from a diff
 */
export function createExecutionPlan(
  diff: FileSystemDiff,
  config: Partial<EngineConfig> = {}
): ExecutionPlan {
  const defaultConfig: EngineConfig = {
    dryRun: false,
    force: false,
    verbose: false,
    backup: true,
    ignoreErrors: false,
    concurrency: 1,
    timeout: 30,
    ...config,
  };

  // Initialize results for each change
  const results: ExecutionResult[] = diff.changes.map((change) => ({
    changeId: change.id,
    status: "pending",
    startTime: new Date(),
  }));

  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    diff,
    changes: diff.changes,
    results,
    status: "ready",
    isDryRun: defaultConfig.dryRun,
    canRollback: canRollback(diff.changes),
    rollbackData: defaultConfig.backup ? {} : undefined,
  };
}

async function executeSingleChange(
  change: FileSystemChange,
  result: ExecutionResult,
  config: EngineConfig,
  onProgress?: (result: ExecutionResult) => void
): Promise<boolean> {
  result.status = "running";
  result.startTime = new Date();

  logger.debug(`Executing change: ${change.type} - ${change.path}`);

  try {
    if (onProgress) {
      onProgress(result);
    }

    await executeChange(change, config);

    result.status = "completed";
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();
    logger.debug(`Change completed: ${change.type} - ${change.path}`);
    return true;
  } catch (error) {
    logger.error(`Change failed: ${change.type} - ${change.path}`, error);
    result.status = "failed";
    result.error = error instanceof Error ? error.message : String(error);
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();

    if (onProgress) {
      onProgress(result);
    }

    return false;
  }
}

function handleExecutionError(plan: ExecutionPlan, error: unknown): void {
  plan.status = "failed";
  for (const result of plan.results) {
    if (result.status === "running") {
      result.status = "failed";
      result.error = error instanceof Error ? error.message : String(error);
      result.endTime = new Date();
    }
  }
}

/**
 * Execute an execution plan
 */
export async function executePlan(
  plan: ExecutionPlan,
  config: EngineConfig,
  onProgress?: (result: ExecutionResult) => void
): Promise<ExecutionPlan> {
  if (plan.status !== "ready" && plan.status !== "planning") {
    throw new Error(`Cannot execute plan with status: ${plan.status}`);
  }

  plan.status = "executing";
  plan.startTime = new Date();

  try {
    // Execute changes in order
    for (let i = 0; i < plan.changes.length; i++) {
      const change = plan.changes[i];
      const result = plan.results[i];

      const success = await executeSingleChange(
        change,
        result,
        config,
        onProgress
      );

      if (onProgress) {
        onProgress(result);
      }

      if (!(success || config.ignoreErrors)) {
        plan.status = "failed";
        break;
      }
    }

    if (plan.status === "executing") {
      plan.status = "completed";
    }
  } catch (error) {
    handleExecutionError(plan, error);
  }

  plan.endTime = new Date();
  return plan;
}

/**
 * Execute a single change
 */
async function executeChange(
  change: FileSystemChange,
  config: EngineConfig
): Promise<void> {
  if (config.dryRun) {
    if (config.verbose) {
      logger.debug(`[DRY RUN] Would execute: ${change.description}`);
    }
    return;
  }

  if (config.verbose) {
    logger.debug(`Executing: ${change.description}`);
  }

  switch (change.type) {
    case "create_directory":
      await createDirectory(change.path);
      break;

    case "create_file":
      await createFile(change);
      break;

    case "create_symlink":
      await createSymlink(change);
      break;

    case "remove_directory":
      if (!config.force && change.isDestructive) {
        throw new Error(
          `Refusing to remove directory without force flag: ${change.path}`
        );
      }
      await removeDirectory(change.path);
      break;

    case "remove_file":
      if (!config.force && change.isDestructive) {
        throw new Error(
          `Refusing to remove file without force flag: ${change.path}`
        );
      }
      await removeFile(change.path);
      break;

    case "update_file_content":
      await updateFileContent(change);
      break;

    case "no_change":
      // Nothing to do
      break;

    default:
      throw new Error(`Unsupported change type: ${change.type}`);
  }
}

/**
 * Create a directory
 */
async function createDirectory(path: string): Promise<void> {
  try {
    await createDirectoryUtil(path);
  } catch (error) {
    throw new Error(`Failed to create directory ${path}: ${error}`);
  }
}

/**
 * Create a file
 */
async function createFile(change: FileSystemChange): Promise<void> {
  try {
    // Get content from the resolved file template
    const content =
      (change.newState?.metadata?.resolvedContent as string) || "";

    // Ensure parent directories exist first
    const pathParts = change.path.split("/");
    pathParts.pop(); // Remove filename
    const parentDir = pathParts.join("/");

    if (parentDir && parentDir !== change.path) {
      await createDirectoryUtil(parentDir);
    }

    // Now write the file content
    await writeFileContentUtil(change.path, content);
  } catch (error) {
    throw new Error(`Failed to create file ${change.path}: ${error}`);
  }
}

/**
 * Create a symlink
 */
function createSymlink(change: FileSystemChange): Promise<void> {
  // Note: Tauri doesn't have direct symlink support yet
  // This would need to be implemented via a Tauri command
  throw new Error(`Symlink creation not yet implemented: ${change.path}`);
}

/**
 * Remove a directory
 */
async function removeDirectory(path: string): Promise<void> {
  try {
    await deleteFileUtil(path);
  } catch (error) {
    throw new Error(`Failed to remove directory ${path}: ${error}`);
  }
}

/**
 * Remove a file
 */
async function removeFile(path: string): Promise<void> {
  try {
    await deleteFileUtil(path);
  } catch (error) {
    throw new Error(`Failed to remove file ${path}: ${error}`);
  }
}

/**
 * Update file content
 */
async function updateFileContent(change: FileSystemChange): Promise<void> {
  try {
    // Get content from the resolved file template
    const content =
      (change.newState?.metadata?.resolvedContent as string) || "";
    await writeFileContentUtil(change.path, content);
  } catch (error) {
    throw new Error(`Failed to update file ${change.path}: ${error}`);
  }
}

/**
 * Check if a set of changes can be rolled back
 */
function canRollback(changes: FileSystemChange[]): boolean {
  // For now, assume we can rollback any change
  // In practice, we'd check if we have backup data for destructive operations
  return changes.some((change) => change.isDestructive);
}

/**
 * Rollback an execution plan
 */
export function rollbackPlan(plan: ExecutionPlan): Promise<void> {
  if (!(plan.canRollback && plan.rollbackData)) {
    throw new Error("Plan cannot be rolled back");
  }

  // TODO: Implement rollback logic
  // This would restore files from backup data
  throw new Error("Rollback not yet implemented");
}

/**
 * Validate that a plan can be executed safely
 */
export function validatePlan(plan: ExecutionPlan): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for conflicting changes
  const paths = new Set<string>();
  for (const change of plan.changes) {
    if (paths.has(change.path)) {
      errors.push(`Multiple changes affect the same path: ${change.path}`);
    }
    paths.add(change.path);
  }

  // Check for destructive operations
  const destructiveChanges = plan.changes.filter((c) => c.isDestructive);
  if (destructiveChanges.length > 0) {
    warnings.push(
      `${destructiveChanges.length} destructive operations will be performed`
    );
  }

  // Check if plan has any changes
  if (plan.changes.length === 0) {
    warnings.push("No changes to execute");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * PlannerExecutor class for planning and executing filesystem changes
 */
