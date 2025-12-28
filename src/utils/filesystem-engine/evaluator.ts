import { join } from "@tauri-apps/api/path";
import type {
  Condition,
  DirectoryDefinition,
  FileDefinition,
  FileEntry,
  FileStructureDefinition,
  FileSystemDefinition,
  ResolvedDefinition,
  ResolvedFileSystemNode,
  SymlinkDefinition,
  VariableValues,
} from "~/types/filesystem-engine";
import { logger } from "~/utils/logger";

/**
 * Evaluates a filesystem definition by resolving variables and building the desired structure
 */

/**
 * Resolve a filesystem definition with variable values
 */
export async function resolveDefinition(
  definition: FileStructureDefinition,
  variables: VariableValues = {}
): Promise<ResolvedDefinition> {
  // Validate variables
  const resolvedVariables = validateAndResolveVariables(
    definition.variables,
    variables
  );

  // Resolve the structure
  const resolvedStructure = await resolveStructure(
    definition.structure,
    definition.basePath,
    resolvedVariables
  );

  return {
    definition,
    variables: resolvedVariables,
    resolvedStructure,
  };
}

/**
 * Validate and resolve variable values with defaults
 */
function validateAndResolveVariables(
  variableDefs: FileStructureDefinition["variables"],
  providedValues: VariableValues
): VariableValues {
  const resolved: VariableValues = {};

  for (const varDef of variableDefs) {
    const provided = providedValues[varDef.name];

    if (provided !== undefined) {
      // Validate provided value
      if (
        varDef.validation &&
        typeof varDef.validation === "object" &&
        varDef.validation &&
        "safeParse" in varDef.validation
      ) {
        const result = (
          varDef.validation as {
            safeParse: (value: unknown) => {
              success: boolean;
              data?: unknown;
              error?: { message: string };
            };
          }
        ).safeParse(provided);
        if (!result.success) {
          throw new Error(
            `Invalid value for variable "${varDef.name}": ${result.error?.message || "Validation failed"}`
          );
        }
        resolved[varDef.name] = result.data;
      } else {
        resolved[varDef.name] = provided;
      }
    } else if (varDef.defaultValue !== undefined) {
      resolved[varDef.name] = varDef.defaultValue;
    } else {
      throw new Error(
        `Required variable "${varDef.name}" not provided and no default value`
      );
    }
  }

  return resolved;
}

/**
 * Recursively resolve the filesystem structure
 */
async function resolveStructure(
  structure: FileSystemDefinition[],
  basePath: string,
  variables: VariableValues
): Promise<ResolvedFileSystemNode[]> {
  const resolved: ResolvedFileSystemNode[] = [];

  for (const item of structure) {
    const resolvedItems = await resolveNodeRecursive(item, basePath, variables);
    resolved.push(...resolvedItems);
  }

  return resolved;
}

/**
 * Recursively resolve a node and all its children
 */
async function resolveNodeRecursive(
  node: FileSystemDefinition,
  currentPath: string,
  variables: VariableValues
): Promise<ResolvedFileSystemNode[]> {
  const resolvedNodes: ResolvedFileSystemNode[] = [];

  // Check condition first
  if (node.condition && !(await evaluateCondition(node.condition, variables))) {
    return resolvedNodes;
  }

  const resolvedName = interpolateString(node.name, variables);
  const fullPath = await join(currentPath, resolvedName);

  const resolvedNode: ResolvedFileSystemNode = {
    type: node.type,
    name: resolvedName,
    path: fullPath,
    originalDefinition: node,
    condition: node.condition,
    metadata: {
      description: node.description,
      shouldExist: true,
      reason: getNodeReason(node),
    },
  };

  // Resolve content for files
  if (node.type === "file") {
    const fileNode = node as FileDefinition;
    if (fileNode.content) {
      resolvedNode.resolvedContent = interpolateString(
        fileNode.content.content,
        variables
      );
    }
  }

  resolvedNodes.push(resolvedNode);

  // Handle children for directories - recursively resolve them
  if (node.type === "directory") {
    const dirNode = node as DirectoryDefinition;
    if (dirNode.children) {
      for (const child of dirNode.children) {
        const childNodes = await resolveNodeRecursive(
          child,
          fullPath,
          variables
        );
        resolvedNodes.push(...childNodes);
      }
    }
  }

  return resolvedNodes;
}

async function evaluatePathCondition(
  condition: Condition,
  variables: VariableValues,
  shouldExist: boolean
): Promise<boolean> {
  if (!condition.path) {
    return !shouldExist;
  }

  const { exists } = await import("@tauri-apps/plugin-fs");
  const resolvedPath = interpolateString(condition.path, variables);

  try {
    const pathExists = await exists(resolvedPath);
    return shouldExist ? pathExists : !pathExists;
  } catch {
    return !shouldExist;
  }
}

function evaluateVariableCondition(
  condition: Condition,
  variables: VariableValues
): boolean {
  if (!condition.variable) {
    return condition.type === "notContains";
  }

  const varValue = variables[condition.variable];

  switch (condition.type) {
    case "equals":
      return varValue === condition.value;
    case "notEquals":
      return varValue !== condition.value;
    case "contains":
      return Array.isArray(varValue)
        ? varValue.includes(condition.value)
        : false;
    case "notContains":
      return Array.isArray(varValue)
        ? !varValue.includes(condition.value)
        : true;
    default:
      return false;
  }
}

/**
 * Evaluate a condition
 */
async function evaluateCondition(
  condition: Condition,
  variables: VariableValues
): Promise<boolean> {
  switch (condition.type) {
    case "exists":
      return await evaluatePathCondition(condition, variables, true);
    case "notExists":
      return await evaluatePathCondition(condition, variables, false);
    case "equals":
    case "notEquals":
    case "contains":
    case "notContains":
      return evaluateVariableCondition(condition, variables);
    default:
      return false;
  }
}

/**
 * Interpolate variables in a string template
 */
function interpolateString(
  template: string,
  variables: VariableValues
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
    const value = variables[varName];
    if (value === undefined) {
      throw new Error(
        `Undefined variable "${varName}" in template: ${template}`
      );
    }
    return String(value);
  });
}

/**
 * Get a human-readable reason for why this node should exist
 */
function getNodeReason(node: FileSystemDefinition): string {
  switch (node.type) {
    case "directory":
      return `Required directory: ${(node as DirectoryDefinition).name}`;
    case "file":
      return `Required file: ${(node as FileDefinition).name}`;
    case "symlink":
      return `Required symlink: ${(node as SymlinkDefinition).name} -> ${(node as SymlinkDefinition).target}`;
    default:
      return "Required filesystem item";
  }
}

/**
 * Compare resolved definition with actual filesystem state
 */
export function compareWithFilesystem(
  resolved: ResolvedDefinition,
  actualEntries: FileEntry[],
  force = false
) {
  const missing: ResolvedFileSystemNode[] = [];
  const extra: FileEntry[] = [];
  const matching: ResolvedFileSystemNode[] = [];
  const conflicts: Array<{
    desired: ResolvedFileSystemNode;
    actual: FileEntry;
    reason: string;
  }> = [];

  // Create maps for efficient lookup
  const actualMap = new Map<string, FileEntry>();
  for (const entry of actualEntries) {
    actualMap.set(entry.path, entry);
  }

  const desiredMap = new Map<string, ResolvedFileSystemNode>();
  for (const node of resolved.resolvedStructure) {
    desiredMap.set(node.path, node);
  }

  // Find missing and matching items
  for (const desired of resolved.resolvedStructure) {
    const actual = actualMap.get(desired.path);

    if (actual) {
      // Check if they match
      if (entriesMatch(desired, actual)) {
        // In force mode, treat all existing items as conflicts to ensure bootstrap
        if (force) {
          conflicts.push({
            desired,
            actual,
            reason: "Force bootstrap mode - recreating existing structure",
          });
        } else {
          logger.debug("non-force mode - marking as matching", desired.name);
          matching.push(desired);
        }
      } else {
        logger.debug("type mismatch - treating as conflict", desired.name);
        conflicts.push({
          desired,
          actual,
          reason: getConflictReason(desired, actual),
        });
      }
    } else {
      missing.push(desired);
    }
  }

  // Find extra items
  for (const actual of actualEntries) {
    if (!desiredMap.has(actual.path)) {
      extra.push(actual);
    }
  }

  return { missing, extra, matching, conflicts };
}

/**
 * Check if a desired node matches an actual filesystem entry
 */
function entriesMatch(
  desired: ResolvedFileSystemNode,
  actual: FileEntry
): boolean {
  // Check basic type match
  if (desired.type === "directory" && !actual.isDirectory) {
    return false;
  }
  if (desired.type === "file" && !actual.isFile) {
    return false;
  }
  if (desired.type === "symlink" && !actual.isSymlink) {
    return false;
  }

  // For files, we could check content hash, but that's expensive
  // For now, just check existence and type
  return true;
}

/**
 * Get reason for a conflict between desired and actual
 */
function getConflictReason(
  desired: ResolvedFileSystemNode,
  actual: FileEntry
): string {
  const reasons: string[] = [];

  if (desired.type === "directory" && !actual.isDirectory) {
    reasons.push("Expected directory but found file/symlink");
  } else if (desired.type === "file" && !actual.isFile) {
    reasons.push("Expected file but found directory/symlink");
  } else if (desired.type === "symlink" && !actual.isSymlink) {
    reasons.push("Expected symlink but found file/directory");
  }

  return reasons.join(", ") || "Type mismatch";
}
