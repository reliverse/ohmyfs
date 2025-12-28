import { Eye, Play, RotateCcw, Save, Settings, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";
import type {
  ExecutionPlan,
  FileEntry,
  FileStructureDefinition,
  FileSystemDiff,
  VariableValues,
} from "~/types/filesystem-engine";
import { FileSystemEngine } from "~/utils/filesystem-engine/engine";
import { DiffViewer } from "./diff-viewer";
import { ExecutionMonitor } from "./execution-monitor";
import { StructureEditor } from "./structure-editor";

interface FileSystemEngineManagerProps {
  initialDefinition?: FileStructureDefinition;
  basePath?: string;
  onDefinitionSave?: (definition: FileStructureDefinition) => void;
  onDefinitionLoad?: () => Promise<FileStructureDefinition | null>;
}

export function FileSystemEngineManager({
  initialDefinition,
  basePath,
  onDefinitionSave,
  onDefinitionLoad,
}: FileSystemEngineManagerProps) {
  const { toast } = useToast();

  // State
  const [definition, setDefinition] = useState<FileStructureDefinition>(
    initialDefinition ||
      FileSystemEngine.createTemplate("My Project", basePath || "./my-project")
  );
  const variables = {} as VariableValues;
  const [currentTab, setCurrentTab] = useState<"edit" | "preview" | "execute">(
    "edit"
  );
  const [diff, setDiff] = useState<FileSystemDiff | null>(null);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [actualEntries, setActualEntries] = useState<FileEntry[]>([]);

  // Engine instance
  const [engine] = useState(
    () =>
      new FileSystemEngine({
        verbose: true,
        dryRun: false,
        backup: true,
      })
  );

  // Load actual filesystem state
  const loadActualFilesystem = useCallback(async () => {
    if (!definition.basePath) {
      return;
    }

    try {
      setIsLoading(true);
      const { readDir, exists } = await import("@tauri-apps/plugin-fs");

      // Check if base path exists
      const basePathExists = await exists(definition.basePath);
      if (!basePathExists) {
        console.warn(`Base path does not exist: ${definition.basePath}`);
        try {
          const { mkdir } = await import("@tauri-apps/plugin-fs");
          await mkdir(definition.basePath, { recursive: true });
          console.log(`Created directory: ${definition.basePath}`);
          toast({
            title: "Directory created",
            description: `Created the base path "${definition.basePath}" since it didn't exist.`,
          });
        } catch (mkdirError) {
          console.error("Failed to create directory:", mkdirError);
          toast({
            title: "Path not found",
            description: `The base path "${definition.basePath}" does not exist and could not be created. Please check the path in the structure definition.`,
            variant: "destructive",
          });
          setActualEntries([]);
          return;
        }
      }

      // Recursively read directory structure
      const readDirectoryRecursive = async (
        path: string
      ): Promise<FileEntry[]> => {
        const entries: FileEntry[] = [];

        try {
          const items = await readDir(path);

          for (const item of items) {
            const entry: FileEntry = {
              name: item.name || "",
              path: `${path}/${item.name}`,
              isDirectory: item.isDirectory,
              isFile: item.isFile,
              isSymlink: item.isSymlink,
              size: undefined, // Would need additional API calls
              modifiedAt: undefined,
              createdAt: undefined,
              permissions: undefined,
              extension: item.name?.split(".").pop(),
              mimeType: undefined,
              thumbnail: undefined,
              metadata: undefined,
            };

            entries.push(entry);
          }
        } catch (error) {
          console.warn(`Failed to read directory ${path}:`, error);
        }

        return entries;
      };

      const entries = await readDirectoryRecursive(definition.basePath);
      setActualEntries(entries);
    } catch (error) {
      console.error("Filesystem loading error:", error);
      toast({
        title: "Error loading filesystem",
        description:
          error instanceof Error
            ? `Failed to load filesystem: ${error.message}`
            : `Unknown filesystem error: ${String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [definition.basePath, toast]);

  // Generate diff
  const generateDiff = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadActualFilesystem();

      const newDiff = await engine.plan(definition, variables, actualEntries);
      setDiff(newDiff);
      setCurrentTab("preview");

      toast({
        title: "Diff generated",
        description: `Found ${newDiff.changes.length} changes to apply`,
      });
    } catch (error) {
      toast({
        title: "Error generating diff",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    definition,
    variables,
    actualEntries,
    engine,
    loadActualFilesystem,
    toast,
  ]);

  // Execute changes
  const executeChanges = useCallback(async () => {
    if (!diff) {
      return;
    }

    try {
      setIsExecuting(true);
      setExecutionProgress(0);

      const plan = await engine.apply(
        definition,
        variables,
        actualEntries,
        (_result) => {
          // Update progress based on completed changes
          const completed =
            executionPlan?.results.filter((r) => r.status === "completed")
              .length || 0;
          const total = executionPlan?.changes.length || 1;
          setExecutionProgress((completed / total) * 100);
        }
      );

      setExecutionPlan(plan);
      setCurrentTab("execute");

      if (plan.status === "completed") {
        toast({
          title: "Execution completed",
          description: `Successfully applied ${plan.results.filter((r) => r.status === "completed").length} changes`,
        });
      } else {
        toast({
          title: "Execution failed",
          description:
            "Failed to apply some changes. Check the execution log for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Execution failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
      setExecutionProgress(0);
    }
  }, [
    diff,
    definition,
    variables,
    actualEntries,
    engine,
    executionPlan,
    toast,
  ]);

  // Save definition
  const saveDefinition = useCallback(() => {
    try {
      if (onDefinitionSave) {
        onDefinitionSave(definition);
      } else {
        // Default save to localStorage
        localStorage.setItem("fs-definition", JSON.stringify(definition));
      }

      toast({
        title: "Definition saved",
        description: "Filesystem definition has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [definition, onDefinitionSave, toast]);

  // Load definition
  const loadDefinition = useCallback(async () => {
    try {
      let loadedDefinition: FileStructureDefinition | null = null;

      if (onDefinitionLoad) {
        loadedDefinition = await onDefinitionLoad();
      } else {
        // Default load from localStorage
        const stored = localStorage.getItem("fs-definition");
        if (stored) {
          loadedDefinition = JSON.parse(stored);
        }
      }

      if (loadedDefinition) {
        setDefinition(loadedDefinition);
        toast({
          title: "Definition loaded",
          description: "Filesystem definition has been loaded successfully",
        });
      } else {
        toast({
          title: "No definition found",
          description: "No saved definition was found to load",
        });
      }
    } catch (error) {
      toast({
        title: "Load failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [onDefinitionLoad, toast]);

  // Reset to initial state
  const reset = useCallback(() => {
    setDiff(null);
    setExecutionPlan(null);
    setCurrentTab("edit");
    setExecutionProgress(0);
  }, []);

  // Load filesystem state when definition changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadActualFilesystem is intentionally omitted to prevent infinite re-renders
  useEffect(() => {
    if (definition.basePath) {
      loadActualFilesystem();
    }
  }, [definition.basePath]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Filesystem Engine</h1>
          <p className="text-muted-foreground">
            Define, preview, and apply filesystem structures declaratively
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={loadDefinition} variant="outline">
            <Upload className="mr-1 h-4 w-4" />
            Load
          </Button>
          <Button onClick={saveDefinition} variant="outline">
            <Save className="mr-1 h-4 w-4" />
            Save
          </Button>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      {(isLoading || isExecuting) && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            {isLoading && <div>Analyzing filesystem...</div>}
            {isExecuting && (
              <div className="flex w-full items-center gap-2">
                <div>Executing changes...</div>
                <Progress
                  className="max-w-xs flex-1"
                  value={executionProgress}
                />
                <div className="text-muted-foreground text-sm">
                  {Math.round(executionProgress)}%
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs onValueChange={(value) => setCurrentTab(value)} value={currentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger disabled={isExecuting} value="edit">
            <Settings className="mr-1 h-4 w-4" />
            Edit Structure
          </TabsTrigger>
          <TabsTrigger disabled={!diff || isExecuting} value="preview">
            <Eye className="mr-1 h-4 w-4" />
            Preview Changes
          </TabsTrigger>
          <TabsTrigger disabled={!executionPlan || isExecuting} value="execute">
            <Play className="mr-1 h-4 w-4" />
            Execution Results
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="edit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Structure Definition</span>
                <Button disabled={isLoading} onClick={generateDiff}>
                  <Eye className="mr-1 h-4 w-4" />
                  Generate Diff
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StructureEditor
                definition={definition}
                onDefinitionChange={setDefinition}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="preview">
          {diff ? (
            <DiffViewer
              diff={diff}
              executionProgress={executionProgress}
              isExecuting={isExecuting}
              onCancel={() => setCurrentTab("edit")}
              onExecute={executeChanges}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Eye className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>
                    No diff generated yet. Go to the Edit tab to generate a
                    diff.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="execute">
          {executionPlan ? (
            <ExecutionMonitor
              onBack={() => setCurrentTab("preview")}
              onRetry={executeChanges}
              plan={executionPlan}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Play className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No execution has been performed yet.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
