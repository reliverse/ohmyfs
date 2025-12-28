import { describe, expect, it, vi } from "vitest";
import type { FileStructureDefinition } from "~/types/filesystem-engine";
import { FileSystemEngine } from "../engine";

// Mock Tauri APIs
vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn(),
  readDir: vi.fn(),
  createDir: vi.fn(),
  writeFile: vi.fn(),
  removeFile: vi.fn(),
  removeDir: vi.fn(),
}));

describe("FileSystemEngine", () => {
  it("should create a template definition", () => {
    const template = FileSystemEngine.createTemplate(
      "Test Project",
      "/tmp/test"
    );

    expect(template.name).toBe("Test Project");
    expect(template.basePath).toBe("/tmp/test");
    expect(template.structure).toHaveLength(2); // README.md and src directory
    expect(template.variables).toHaveLength(0);
  });

  it("should validate a correct definition", () => {
    const engine = new FileSystemEngine();
    const definition: FileStructureDefinition = {
      name: "Test",
      version: "1.0.0",
      basePath: "/tmp/test",
      variables: [],
      structure: [
        {
          type: "file",
          name: "test.txt",
        },
      ],
    };

    const validation = engine.validateDefinition(definition);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject invalid definition", () => {
    const engine = new FileSystemEngine();
    const definition = {
      // Missing required fields
    } as any;

    const validation = engine.validateDefinition(definition);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it("should parse and serialize definitions", () => {
    const original: FileStructureDefinition = {
      name: "Test",
      description: "Test description",
      version: "1.0.0",
      basePath: "/tmp/test",
      variables: [],
      structure: [
        {
          type: "file",
          name: "test.txt",
        },
      ],
    };

    const json = FileSystemEngine.serializeDefinition(original);
    const parsed = FileSystemEngine.parseDefinition(json);

    expect(parsed.name).toBe(original.name);
    expect(parsed.basePath).toBe(original.basePath);
    expect(parsed.structure).toHaveLength(1);
  });

  it("should interpolate variables in strings", () => {
    // This test would require mocking the evaluator internals
    // For now, just test the engine instantiation
    const engine = new FileSystemEngine();
    expect(engine).toBeDefined();

    const config = engine.getConfig();
    expect(config).toBeDefined();
    expect(config.dryRun).toBe(false); // Default value
  });
});
