import {
  Download,
  Eye,
  Play,
  RotateCcw,
  Save,
  Settings,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  createShareableDefinition,
  exportDefinition,
  importDefinition,
} from "~/utils/filesystem-engine/import-export";
import { DiffViewer } from "./diff-viewer";
import { ExecutionMonitor } from "./execution-monitor";
import { StructureEditor } from "./structure-editor";

interface FileSystemEngineManagerProps {
  initialDefinition?: FileStructureDefinition;
  basePath?: string;
}

export function FileSystemEngineManager({
  initialDefinition,
  basePath,
}: FileSystemEngineManagerProps) {
  const { toast } = useToast();
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
  const processedBasePathsRef = useRef<Set<string>>(new Set());

  const [engine] = useState(
    () =>
      new FileSystemEngine({
        verbose: true,
        dryRun: false,
        backup: true,
      })
  );

  const ensureBaseDirectory = useCallback(async () => {
    const { fileExists, createDirectory } = await import("~/utils/file-system");

    const hasProcessedPath = processedBasePathsRef.current.has(
      definition.basePath
    );
    const basePathExists =
      hasProcessedPath || (await fileExists(definition.basePath));

    if (!basePathExists) {
      console.warn(`Base path does not exist: ${definition.basePath}`);
      await createDirectory(definition.basePath);
      console.log(`Created directory: ${definition.basePath}`);
      processedBasePathsRef.current.add(definition.basePath);
      toast({
        title: "Directory created",
        description: `Created the base path "${definition.basePath}" since it didn't exist.`,
      });
    } else if (!hasProcessedPath) {
      processedBasePathsRef.current.add(definition.basePath);
    }
  }, [definition.basePath, toast]);

  const loadFilesystemEntries = useCallback(async () => {
    const { readDirectory } = await import("~/utils/file-system");
    const entries = await readDirectory(definition.basePath, true);
    setActualEntries(entries);
  }, [definition.basePath]);

  const loadActualFilesystem = useCallback(async () => {
    if (!definition.basePath) {
      return;
    }

    try {
      setIsLoading(true);
      await ensureBaseDirectory();
      await loadFilesystemEntries();
    } catch (error) {
      console.error("Filesystem loading error:", error);

      if (error instanceof Error && error.message.includes("directory")) {
        // Directory creation failed
        toast({
          title: "Path not found",
          description: `The base path "${definition.basePath}" does not exist and could not be created.`,
          variant: "destructive",
        });
        setActualEntries([]);
        return;
      }

      // General filesystem error
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
  }, [definition.basePath, ensureBaseDirectory, loadFilesystemEntries, toast]);

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

  const reset = useCallback(() => {
    setDiff(null);
    setExecutionPlan(null);
    setCurrentTab("edit");
    setExecutionProgress(0);
  }, []);

  const exportCurrentDefinition = useCallback(async () => {
    try {
      await exportDefinition(definition);
      toast({
        title: "Definition exported",
        description: "Filesystem definition has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [definition, toast]);

  const importDefinitionFile = useCallback(async () => {
    try {
      const importedDefinition = await importDefinition();
      setDefinition(importedDefinition);
      // Reset state when importing new definition
      setDiff(null);
      setExecutionPlan(null);
      setCurrentTab("edit");
      toast({
        title: "Definition imported",
        description: `"${importedDefinition.name}" has been imported successfully`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [toast]);

  const createShareableFile = useCallback(async () => {
    try {
      await createShareableDefinition(definition);
      toast({
        title: "Shareable file created",
        description: "Shareable definition file has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Shareable file creation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [definition, toast]);

  useEffect(() => {
    processedBasePathsRef.current.clear();
  }, []);

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
          <Button onClick={importDefinitionFile} variant="outline">
            <Upload className="mr-1 h-4 w-4" />
            Import
          </Button>
          <Button onClick={exportCurrentDefinition} variant="outline">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button onClick={createShareableFile} variant="outline">
            <Save className="mr-1 h-4 w-4" />
            Share
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
