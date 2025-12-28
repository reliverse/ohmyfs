import { homeDir } from "@tauri-apps/api/path";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeFile } from "@tauri-apps/plugin-fs";
import type {
  FileStructureDefinition,
  FileSystemDefinition,
} from "~/types/filesystem-engine";
import { FileStructureDefinitionSchema } from "~/types/filesystem-engine";
import { writeFileContent } from "~/utils/file-system";

/**
 * Export a filesystem definition to a JSON file in the user's home directory
 */
export async function exportDefinition(
  definition: FileStructureDefinition
): Promise<string> {
  try {
    // Validate the definition
    const validationResult =
      FileStructureDefinitionSchema.safeParse(definition);
    if (!validationResult.success) {
      throw new Error(`Invalid definition: ${validationResult.error.message}`);
    }

    // Get home directory and create file path
    const home = await homeDir();
    const fileName = `${definition.name.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    const filePath = `${home}${fileName}`;

    // Convert to JSON with pretty formatting
    const jsonContent = JSON.stringify(definition, null, 2);

    // Write to file
    await writeFileContent(filePath, jsonContent);

    return filePath;
  } catch (error) {
    console.error("Export failed:", error);
    throw new Error(
      `Failed to export definition: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Import a filesystem definition from a JSON file
 */
export async function importDefinition(): Promise<FileStructureDefinition> {
  try {
    // Open file dialog
    const filePath = await open({
      filters: [
        {
          name: "JSON Files",
          extensions: ["json"],
        },
      ],
      multiple: false,
      directory: false,
    });

    if (!filePath || Array.isArray(filePath)) {
      throw new Error("No file selected or invalid selection");
    }

    // Read file content
    const content = await readTextFile(filePath);

    // Parse JSON
    let parsedDefinition: unknown;
    try {
      parsedDefinition = JSON.parse(content);
    } catch (_parseError) {
      throw new Error("Invalid JSON format in selected file");
    }

    // Validate with Zod schema
    const validationResult =
      FileStructureDefinitionSchema.safeParse(parsedDefinition);
    if (!validationResult.success) {
      throw new Error(
        `Invalid filesystem definition: ${validationResult.error.message}`
      );
    }

    return validationResult.data;
  } catch (error) {
    console.error("Import failed:", error);
    throw new Error(
      `Failed to import definition: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Export multiple definitions to a single JSON file
 */
export async function exportDefinitionsBatch(
  definitions: FileStructureDefinition[]
): Promise<void> {
  try {
    // Validate all definitions
    for (const definition of definitions) {
      const validationResult =
        FileStructureDefinitionSchema.safeParse(definition);
      if (!validationResult.success) {
        throw new Error(
          `Invalid definition "${definition.name}": ${validationResult.error.message}`
        );
      }
    }

    // Open save dialog
    const filePath = await save({
      filters: [
        {
          name: "JSON Files",
          extensions: ["json"],
        },
      ],
      defaultPath: "filesystem-definitions-batch.json",
    });

    if (!filePath) {
      return; // User cancelled
    }

    // Create batch format
    const batchData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      definitions,
    };

    // Convert to JSON with pretty formatting
    const jsonContent = JSON.stringify(batchData, null, 2);

    // Write to file
    await writeFile(filePath, new TextEncoder().encode(jsonContent));
  } catch (error) {
    console.error("Batch export failed:", error);
    throw new Error(
      `Failed to export definitions: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Import multiple definitions from a batch JSON file
 */
// Helper function to read and parse JSON file
async function readAndParseJsonFile(): Promise<unknown> {
  const filePath = await open({
    filters: [
      {
        name: "JSON Files",
        extensions: ["json"],
      },
    ],
    multiple: false,
    directory: false,
  });

  if (!filePath || Array.isArray(filePath)) {
    throw new Error("No file selected or invalid selection");
  }

  const content = await readTextFile(filePath);

  try {
    return JSON.parse(content);
  } catch (_parseError) {
    throw new Error("Invalid JSON format in selected file");
  }
}

// Helper function to validate batch definitions
function validateBatchDefinitions(
  definitions: unknown[]
): FileStructureDefinition[] {
  const validatedDefinitions: FileStructureDefinition[] = [];

  for (const def of definitions) {
    const validationResult = FileStructureDefinitionSchema.safeParse(def);
    if (!validationResult.success) {
      throw new Error(
        `Invalid definition in batch: ${validationResult.error.message}`
      );
    }
    validatedDefinitions.push(validationResult.data);
  }

  return validatedDefinitions;
}

// Helper function to validate single definition
function validateSingleDefinition(data: unknown): FileStructureDefinition {
  const validationResult = FileStructureDefinitionSchema.safeParse(data);
  if (!validationResult.success) {
    throw new Error(
      `Invalid filesystem definition: ${validationResult.error.message}`
    );
  }
  return validationResult.data;
}

export async function importDefinitionsBatch(): Promise<
  FileStructureDefinition[]
> {
  try {
    const parsedData = await readAndParseJsonFile();

    // Check if it's a batch format
    if (
      typeof parsedData === "object" &&
      parsedData !== null &&
      "definitions" in parsedData
    ) {
      const batchData = parsedData as { definitions: unknown[] };

      if (!Array.isArray(batchData.definitions)) {
        throw new Error("Invalid batch format: definitions should be an array");
      }

      return validateBatchDefinitions(batchData.definitions);
    }

    // Try to parse as single definition
    return [validateSingleDefinition(parsedData)];
  } catch (error) {
    console.error("Batch import failed:", error);
    throw new Error(
      `Failed to import definitions: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a shareable definition file with metadata
 */
export async function createShareableDefinition(
  definition: FileStructureDefinition
): Promise<void> {
  try {
    // Validate the definition
    const validationResult =
      FileStructureDefinitionSchema.safeParse(definition);
    if (!validationResult.success) {
      throw new Error(`Invalid definition: ${validationResult.error.message}`);
    }

    // Create shareable format with additional metadata
    const shareableData = {
      version: "1.0",
      format: "ohmyfs-filesystem-definition",
      createdAt: new Date().toISOString(),
      tool: "OhMyFS Filesystem Engine",
      definition,
      metadata: {
        fileCount: countFilesInDefinition(definition),
        directoryCount: countDirectoriesInDefinition(definition),
        hasVariables: (definition.variables?.length ?? 0) > 0,
        estimatedSize: estimateDefinitionSize(definition),
      },
    };

    // Open save dialog
    const filePath = await save({
      filters: [
        {
          name: "OhMyFS Definition",
          extensions: ["ohmyfs"],
        },
        {
          name: "JSON Files",
          extensions: ["json"],
        },
      ],
      defaultPath: `${definition.name.replace(/[^a-zA-Z0-9]/g, "_")}.ohmyfs`,
    });

    if (!filePath) {
      return; // User cancelled
    }

    // Convert to JSON with pretty formatting
    const jsonContent = JSON.stringify(shareableData, null, 2);

    // Write to file
    await writeFile(filePath, new TextEncoder().encode(jsonContent));
  } catch (error) {
    console.error("Create shareable definition failed:", error);
    throw new Error(
      `Failed to create shareable definition: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Import a shareable definition file
 */
export async function importShareableDefinition(): Promise<FileStructureDefinition> {
  try {
    // Open file dialog
    const filePath = await open({
      filters: [
        {
          name: "OhMyFS Definition",
          extensions: ["ohmyfs"],
        },
        {
          name: "JSON Files",
          extensions: ["json"],
        },
      ],
      multiple: false,
      directory: false,
    });

    if (!filePath || Array.isArray(filePath)) {
      throw new Error("No file selected or invalid selection");
    }

    // Read file content
    const content = await readTextFile(filePath);

    // Parse JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(content);
    } catch (_parseError) {
      throw new Error("Invalid JSON format in selected file");
    }

    // Check if it's a shareable format
    if (
      typeof parsedData === "object" &&
      parsedData !== null &&
      "definition" in parsedData
    ) {
      const shareableData = parsedData as { definition: unknown };

      // Validate the definition
      const validationResult = FileStructureDefinitionSchema.safeParse(
        shareableData.definition
      );
      if (!validationResult.success) {
        throw new Error(
          `Invalid filesystem definition: ${validationResult.error.message}`
        );
      }

      return validationResult.data;
    }
    // Try to parse as regular definition
    const validationResult =
      FileStructureDefinitionSchema.safeParse(parsedData);
    if (!validationResult.success) {
      throw new Error(
        `Invalid filesystem definition: ${validationResult.error.message}`
      );
    }

    return validationResult.data;
  } catch (error) {
    console.error("Import shareable definition failed:", error);
    throw new Error(
      `Failed to import shareable definition: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper functions
function countFilesInDefinition(definition: FileStructureDefinition): number {
  let count = 0;

  function countInStructure(structure: FileSystemDefinition[]): void {
    for (const item of structure) {
      if (item.type === "file") {
        count++;
      } else if (item.type === "directory" && item.children) {
        countInStructure(item.children);
      }
    }
  }

  countInStructure(definition.structure);
  return count;
}

function countDirectoriesInDefinition(
  definition: FileStructureDefinition
): number {
  let count = 0;

  function countInStructure(structure: FileSystemDefinition[]): void {
    for (const item of structure) {
      if (item.type === "directory") {
        count++;
        if (item.children) {
          countInStructure(item.children);
        }
      }
    }
  }

  countInStructure(definition.structure);
  return count;
}

function estimateDefinitionSize(definition: FileStructureDefinition): string {
  // Rough estimation based on content
  let totalSize = 0;

  function calculateSize(structure: FileSystemDefinition[]): void {
    for (const item of structure) {
      if (item.type === "file" && item.content?.content) {
        totalSize += item.content.content.length;
      } else if (item.type === "directory" && item.children) {
        calculateSize(item.children);
      }
    }
  }

  calculateSize(definition.structure);

  // Convert to human readable size
  if (totalSize < 1024) {
    return `${totalSize} B`;
  }
  if (totalSize < 1024 * 1024) {
    return `${Math.round(totalSize / 1024)} KB`;
  }
  return `${Math.round(totalSize / (1024 * 1024))} MB`;
}
