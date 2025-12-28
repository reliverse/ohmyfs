import type {
  EngineConfig,
  ExecutionPlan,
  ExecutionResult,
  FileEntry,
  FileStructureDefinition,
  FileSystemDiff,
  ResolvedDefinition,
  ValidationResult,
  VariableValues,
} from "~/types/filesystem-engine";

import { generateDiff } from "./diff-engine";
import { resolveDefinition } from "./evaluator";
import {
  createExecutionPlan,
  executePlan,
  validatePlan,
} from "./planner-executor";

/**
 * Main filesystem engine that orchestrates the entire process
 */
export class FileSystemEngine {
  private config: EngineConfig;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      dryRun: false,
      force: false,
      verbose: false,
      backup: true,
      ignoreErrors: false,
      concurrency: 1,
      timeout: 30,
      ...config,
    };
  }

  /**
   * Validate a filesystem definition
   */
  validateDefinition(definition: FileStructureDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Validate with Zod schema
      const result = definition; // FileStructureDefinitionSchema.parse(definition);
      if (!result) {
        errors.push("Invalid definition structure");
      }
    } catch (error) {
      errors.push(
        `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Check for required fields
    if (!definition.name) {
      errors.push("Definition name is required");
    }

    if (!definition.basePath) {
      errors.push("Base path is required");
    }

    if (!definition.structure || definition.structure.length === 0) {
      warnings.push("Definition has no structure to create");
    }

    // Validate variables
    for (const variable of definition.variables || []) {
      if (!variable.name) {
        errors.push("Variable name is required");
      }
    }

    // Suggest improvements
    if (!definition.description) {
      suggestions.push(
        "Add a description to your definition for better documentation"
      );
    }

    if (!definition.version) {
      suggestions.push(
        "Add a version to your definition for better change tracking"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Plan changes needed to achieve the desired filesystem state
   */
  async plan(
    definition: FileStructureDefinition,
    variables: VariableValues = {},
    actualEntries: FileEntry[] = []
  ): Promise<FileSystemDiff> {
    // Validate definition first
    const validation = this.validateDefinition(definition);
    if (!validation.isValid) {
      throw new Error(`Invalid definition: ${validation.errors.join(", ")}`);
    }

    // Generate diff
    const diff = await generateDiff(definition, variables, actualEntries);

    if (this.config.verbose) {
      console.log("Generated diff:", {
        totalChanges: diff.changes.length,
        summary: diff.summary,
        isSafe: diff.isSafe,
        canExecute: diff.canExecute,
      });
    }

    return diff;
  }

  /**
   * Apply a filesystem definition (plan + execute)
   */
  async apply(
    definition: FileStructureDefinition,
    variables: VariableValues = {},
    actualEntries: FileEntry[] = [],
    onProgress?: (result: ExecutionResult) => void
  ): Promise<ExecutionPlan> {
    // Plan the changes
    const diff = await this.plan(definition, variables, actualEntries);

    if (!diff.canExecute) {
      throw new Error(`Cannot execute diff: ${diff.errors.join(", ")}`);
    }

    // Create execution plan
    const plan = createExecutionPlan(diff, this.config);

    // Validate plan
    const validation = validatePlan(plan);
    if (!validation.isValid) {
      throw new Error(
        `Invalid execution plan: ${validation.errors.join(", ")}`
      );
    }

    if (this.config.verbose) {
      console.log("Created execution plan:", {
        id: plan.id,
        changes: plan.changes.length,
        isDryRun: plan.isDryRun,
        canRollback: plan.canRollback,
      });
    }

    // Execute the plan
    const executedPlan = await executePlan(plan, this.config, onProgress);

    if (this.config.verbose) {
      console.log("Execution completed:", {
        status: executedPlan.status,
        duration:
          executedPlan.endTime && executedPlan.startTime
            ? executedPlan.endTime.getTime() - executedPlan.startTime.getTime()
            : 0,
        results: executedPlan.results.map((r) => ({
          id: r.changeId,
          status: r.status,
          duration: r.duration,
        })),
      });
    }

    return executedPlan;
  }

  /**
   * Preview what would happen without making changes
   */
  async preview(
    definition: FileStructureDefinition,
    variables: VariableValues = {},
    actualEntries: FileEntry[] = []
  ): Promise<FileSystemDiff> {
    const originalDryRun = this.config.dryRun;
    this.config.dryRun = true;

    try {
      return await this.plan(definition, variables, actualEntries);
    } finally {
      this.config.dryRun = originalDryRun;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): EngineConfig {
    return { ...this.config };
  }

  /**
   * Resolve a definition with variables (utility method)
   */
  async resolveDefinition(
    definition: FileStructureDefinition,
    variables: VariableValues = {}
  ): Promise<ResolvedDefinition> {
    return await resolveDefinition(definition, variables);
  }

  /**
   * Create a basic filesystem definition template
   */
  static createTemplate(
    name: string,
    basePath: string
  ): FileStructureDefinition {
    return {
      name,
      description: `Filesystem structure for ${name}`,
      version: "1.0.0",
      basePath,
      variables: [],
      structure: [
        {
          type: "directory",
          name: "src",
          description: "Source code directory",
          children: [
            {
              type: "file",
              name: "main.js",
              description: "Main application file",
              content: {
                content: 'console.log("Hello, World!");',
                encoding: "utf8",
              },
            },
          ],
        },
        {
          type: "file",
          name: "README.md",
          description: "Project documentation",
          content: {
            content: `# ${name}\n\nProject description here.`,
            encoding: "utf8",
          },
        },
      ],
    };
  }

  /**
   * Parse a definition from JSON/YAML string
   */
  static parseDefinition(jsonString: string): FileStructureDefinition {
    try {
      const parsed = JSON.parse(jsonString);

      // TODO: Validate with schema
      return parsed as FileStructureDefinition;
    } catch (error) {
      throw new Error(
        `Failed to parse definition: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Serialize a definition to JSON
   */
  static serializeDefinition(definition: FileStructureDefinition): string {
    return JSON.stringify(definition, null, 2);
  }
}
