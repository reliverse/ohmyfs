import { z } from "zod";
import type { FileEntry } from "./file";

// ============================================================================
// Core Schema Types
// ============================================================================

/**
 * Variables that can be used in filesystem definitions
 * Variables are resolved at runtime and can reference environment, user input, etc.
 */
export interface Variable {
  name: string;
  type: "string" | "number" | "boolean" | "path";
  defaultValue?: unknown;
  description?: string;
  validation?: unknown; // Zod schema or unknown for imported definitions
}

/**
 * Template for file content with variable substitution
 */
export interface FileTemplate {
  content: string; // Template string with {{variable}} placeholders
  encoding?: "utf8" | "base64" | "binary";
  executable?: boolean; // For Unix systems
  permissions?: string; // Octal permissions like '755'
}

/**
 * Directory structure definition
 */
export interface DirectoryDefinition {
  type: "directory";
  name: string; // Can contain variables like "{{projectName}}"
  children?: FileSystemDefinition[];
  condition?: Condition;
  description?: string;
}

/**
 * File definition with optional template
 */
export interface FileDefinition {
  type: "file";
  name: string; // Can contain variables
  content?: FileTemplate;
  condition?: Condition;
  description?: string;
}

/**
 * Symbolic link definition
 */
export interface SymlinkDefinition {
  type: "symlink";
  name: string;
  target: string; // Target path, can contain variables
  condition?: Condition;
  description?: string;
}

/**
 * Union type for all filesystem definitions
 */
export type FileSystemDefinition =
  | DirectoryDefinition
  | FileDefinition
  | SymlinkDefinition;

/**
 * Condition for conditional definitions
 */
export interface Condition {
  type:
    | "exists"
    | "notExists"
    | "equals"
    | "notEquals"
    | "contains"
    | "notContains";
  path?: string; // Path to check
  value?: unknown; // Value to compare against
  variable?: string; // Variable name to check
}

/**
 * Complete filesystem structure definition
 */
export interface FileStructureDefinition {
  name: string;
  description?: string;
  version: string;
  basePath: string; // Root path where structure should be created
  variables: Variable[];
  structure: FileSystemDefinition[];
  ignorePatterns?: string[]; // .gitignore-style patterns
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Runtime Types
// ============================================================================

/**
 * Resolved variable values
 */
export type VariableValues = Record<string, unknown>;

/**
 * Resolved filesystem definition with all variables substituted
 */
export interface ResolvedDefinition {
  definition: FileStructureDefinition;
  variables: VariableValues;
  resolvedStructure: ResolvedFileSystemNode[];
}

/**
 * Resolved filesystem node
 */
export interface ResolvedFileSystemNode {
  type: "directory" | "file" | "symlink";
  name: string;
  path: string; // Full resolved path
  originalDefinition: FileSystemDefinition;
  resolvedContent?: string; // For files: resolved content with variables substituted
  condition?: Condition;
  metadata?: {
    description?: string;
    shouldExist: boolean;
    reason?: string;
  };
}

// ============================================================================
// Diff Model Types
// ============================================================================

/**
 * Types of changes that can be made to the filesystem
 */
export type ChangeType =
  | "create_directory"
  | "create_file"
  | "create_symlink"
  | "remove_directory"
  | "remove_file"
  | "remove_symlink"
  | "update_file_content"
  | "update_permissions"
  | "no_change";

/**
 * Individual change in the filesystem
 */
export interface FileSystemChange {
  id: string;
  type: ChangeType;
  path: string;
  oldState?: FileEntry;
  newState?: FileEntry;
  isDestructive: boolean; // Whether this change removes data
  isSafe: boolean; // Whether this change is low-risk
  description: string;
  reason: string; // Why this change is needed
  dependencies?: string[]; // IDs of changes that must happen first
  warnings?: string[];
  errors?: string[];
}

/**
 * Summary of changes
 */
export interface ChangeSummary {
  total: number;
  create: number;
  update: number;
  remove: number;
  destructive: number;
  safe: number;
  warnings: number;
  errors: number;
}

/**
 * Complete diff between desired and actual state
 */
export interface FileSystemDiff {
  definition: FileStructureDefinition;
  variables: VariableValues;
  changes: FileSystemChange[];
  summary: ChangeSummary;
  timestamp: Date;
  isSafe: boolean; // Overall safety assessment
  canExecute: boolean; // Whether the plan can be executed
  warnings: string[];
  errors: string[];
  metadata?: {
    safetyScore: number;
    blockedChangesCount: number;
  };
}

// ============================================================================
// Execution Types
// ============================================================================

/**
 * Status of an individual change execution
 */
export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "cancelled";

/**
 * Result of executing a change
 */
export interface ExecutionResult {
  changeId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  output?: string;
  rollbackData?: unknown; // Data needed to rollback this change
}

/**
 * Complete execution plan and results
 */
export interface ExecutionPlan {
  id: string;
  diff: FileSystemDiff;
  changes: FileSystemChange[];
  results: ExecutionResult[];
  status:
    | "planning"
    | "ready"
    | "executing"
    | "completed"
    | "failed"
    | "cancelled";
  startTime?: Date;
  endTime?: Date;
  isDryRun: boolean;
  canRollback: boolean;
  rollbackData?: Record<string, unknown>;
}

// ============================================================================
// Engine Configuration
// ============================================================================

/**
 * Configuration for the filesystem engine
 */
export interface EngineConfig {
  dryRun: boolean;
  force: boolean; // Override safety checks
  verbose: boolean;
  backup: boolean; // Create backups before destructive operations
  ignoreErrors: boolean; // Continue execution despite errors
  concurrency: number; // Max concurrent operations
  timeout: number; // Timeout per operation in seconds
}

// ============================================================================
// UI Types
// ============================================================================

/**
 * Tree node for UI visualization
 */
export interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: "directory" | "file" | "symlink";
  children?: TreeNode[];
  isExpanded?: boolean;
  changeType?: ChangeType;
  hasChanges?: boolean;
  isIgnored?: boolean;
  metadata?: unknown;
}

/**
 * Validation result for a definition
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const VariableSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "path"]),
  defaultValue: z.unknown().optional(),
  description: z.string().optional(),
  validation: z.unknown().optional(), // Zod schema
});

export const FileTemplateSchema = z.object({
  content: z.string(),
  encoding: z.enum(["utf8", "base64", "binary"]).default("utf8"),
  executable: z.boolean().default(false),
  permissions: z.string().optional(),
});

export const ConditionSchema = z.object({
  type: z.enum([
    "exists",
    "notExists",
    "equals",
    "notEquals",
    "contains",
    "notContains",
  ]),
  path: z.string().optional(),
  value: z.unknown().optional(),
  variable: z.string().optional(),
});

export const FileDefinitionSchema = z.object({
  type: z.literal("file"),
  name: z.string().min(1),
  content: FileTemplateSchema.optional(),
  condition: ConditionSchema.optional(),
  description: z.string().optional(),
});

export const SymlinkDefinitionSchema = z.object({
  type: z.literal("symlink"),
  name: z.string().min(1),
  target: z.string().min(1),
  condition: ConditionSchema.optional(),
  description: z.string().optional(),
});

// Create the discriminated union first, then use it in DirectoryDefinitionSchema
export const FileSystemDefinitionSchema: z.ZodType<FileSystemDefinition> =
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("directory"),
      name: z.string().min(1),
      children: z.lazy(() => z.array(FileSystemDefinitionSchema)).optional(),
      condition: ConditionSchema.optional(),
      description: z.string().optional(),
    }),
    FileDefinitionSchema,
    SymlinkDefinitionSchema,
  ]);

// Alias for directory schema (for backward compatibility)
export const DirectoryDefinitionSchema = z.object({
  type: z.literal("directory"),
  name: z.string().min(1),
  children: z.lazy(() => z.array(FileSystemDefinitionSchema)).optional(),
  condition: ConditionSchema.optional(),
  description: z.string().optional(),
});

export const FileStructureDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().min(1),
  basePath: z.string().min(1),
  variables: z.array(VariableSchema).default([]),
  structure: z.array(FileSystemDefinitionSchema),
  ignorePatterns: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Re-export FileEntry from existing types
export type { FileEntry } from "./file";
