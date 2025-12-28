import {
  Download,
  FileText,
  Folder,
  Globe,
  Package,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { useStructureTemplates } from "~/hooks/use-filesystem-engine";
import type {
  FileStructureDefinition,
  VariableValues,
} from "~/types/filesystem-engine";
import {
  exportDefinition,
  importDefinition,
} from "~/utils/filesystem-engine/import-export";
import { logger } from "~/utils/logger";

interface QuickStructurePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onStructureApplied?: () => void;
  onDefinitionImported?: (definition: FileStructureDefinition) => void;
}

const TEMPLATE_ICONS = {
  "react-app": Package,
  "node-package": FileText,
  "web-project": Globe,
};

export function QuickStructurePanel({
  isOpen,
  onClose,
  currentPath,
  onStructureApplied,
  onDefinitionImported,
}: QuickStructurePanelProps) {
  const { getAvailableTemplates, applyTemplate, isApplying } =
    useStructureTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [variables, setVariables] = useState<VariableValues>({});
  const [customBasePath, setCustomBasePath] = useState("");

  const templates = getAvailableTemplates();

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      setVariables({});
      setCustomBasePath("");
    }
  }, [isOpen]);

  const handleApplyTemplate = useCallback(async () => {
    if (!selectedTemplate) {
      return;
    }

    const basePath = customBasePath || currentPath;

    if (!basePath || basePath.trim() === "") {
      logger.error("Quick Structure: No valid base path provided");
      return;
    }

    logger.debug(
      `Quick Structure: Applying template ${selectedTemplate} to basePath: "${basePath}"`
    );

    const result = await applyTemplate(selectedTemplate, basePath, variables);

    if (result.success) {
      onStructureApplied?.();
      onClose();
    }
  }, [
    selectedTemplate,
    customBasePath,
    currentPath,
    variables,
    applyTemplate,
    onStructureApplied,
    onClose,
  ]);

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  const handleImportDefinition = useCallback(async () => {
    try {
      const importedDefinition = await importDefinition();
      onDefinitionImported?.(importedDefinition);
      onClose();
    } catch (error) {
      logger.error("Import failed:", error);
    }
  }, [onDefinitionImported, onClose]);

  const handleExportDefinition = useCallback(async () => {
    if (!selectedTemplateData) {
      return;
    }

    try {
      await exportDefinition(selectedTemplateData);
    } catch (error) {
      logger.error("Export failed:", error);
    }
  }, [selectedTemplateData]);

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      setSelectedTemplate(templateId);
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        // Reset variables to defaults
        const defaultVars: VariableValues = {};
        for (const v of template.variables) {
          if (v.defaultValue !== undefined) {
            defaultVars[v.name] = v.defaultValue;
          }
        }
        setVariables(defaultVars);
      }
    },
    [templates]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l bg-background shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-semibold text-lg">Quick Structure</h2>
          <p className="text-muted-foreground text-sm">
            Apply predefined project structures
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleImportDefinition} size="sm" variant="ghost">
            <Upload className="h-4 w-4" />
          </Button>
          {selectedTemplateData && (
            <Button onClick={handleExportDefinition} size="sm" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={onClose} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full w-full scroll-smooth">
          <div className="min-h-[600px] space-y-4 p-4 pb-6">
            {/* Base Path */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Target Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label
                    className="text-muted-foreground text-xs"
                    htmlFor="base-path"
                  >
                    Base Path
                  </Label>
                  <Input
                    className="text-sm"
                    id="base-path"
                    onChange={(e) => setCustomBasePath(e.target.value)}
                    placeholder={currentPath}
                    value={customBasePath}
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    Leave empty to use current directory
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Choose Template</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-48">
                  <div className="grid gap-2 pr-4">
                    {templates.map((template) => {
                      const Icon =
                        TEMPLATE_ICONS[
                          template.id as keyof typeof TEMPLATE_ICONS
                        ] || Folder;
                      return (
                        <Button
                          className="h-auto justify-start p-3"
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          variant={
                            selectedTemplate === template.id
                              ? "default"
                              : "outline"
                          }
                        >
                          <Icon className="mr-3 h-5 w-5 shrink-0" />
                          <div className="min-w-0 flex-1 text-left">
                            <div className="truncate font-medium text-sm">
                              {template.name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {template.description}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Variables Configuration */}
            {selectedTemplateData &&
              selectedTemplateData.variables.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Configure Variables
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ScrollArea className="max-h-40">
                      <div className="space-y-3 pr-4">
                        {selectedTemplateData.variables.map((variable) => (
                          <div key={variable.name}>
                            <Label
                              className="text-muted-foreground text-xs"
                              htmlFor={`var-${variable.name}`}
                            >
                              {variable.name}
                              {variable.description && (
                                <span className="ml-1 text-muted-foreground">
                                  - {variable.description}
                                </span>
                              )}
                            </Label>
                            <Input
                              className="text-sm"
                              id={`var-${variable.name}`}
                              onChange={(e) =>
                                setVariables((prev) => ({
                                  ...prev,
                                  [variable.name]:
                                    variable.type === "number"
                                      ? Number(e.target.value)
                                      : e.target.value,
                                }))
                              }
                              placeholder={String(variable.defaultValue || "")}
                              type={
                                variable.type === "number" ? "number" : "text"
                              }
                              value={String(variables[variable.name] ?? "")}
                            />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

            {/* Template Preview */}
            {selectedTemplateData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Structure Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-muted-foreground text-xs">
                    <div className="break-all rounded bg-muted/50 p-2 font-mono text-xs">
                      Base: {customBasePath || currentPath}
                    </div>
                    <Separator />
                    <ScrollArea className="h-64 w-full rounded border bg-muted/20 p-3">
                      <div className="font-mono text-xs leading-relaxed">
                        <StructurePreview
                          structure={selectedTemplateData.structure}
                        />
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Button
          className="w-full"
          disabled={!selectedTemplate || isApplying}
          onClick={handleApplyTemplate}
        >
          {isApplying ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Applying...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Apply Structure
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface StructurePreviewProps {
  structure: Array<{
    type: string;
    name: string;
    children?: Array<{
      type: string;
      name: string;
      children?: StructurePreviewProps["structure"];
    }>;
  }>;
  level?: number;
}

function StructurePreview({ structure, level = 0 }: StructurePreviewProps) {
  return (
    <div className="space-y-0.5">
      {structure.map((item, index) => (
        <div key={`${item.type}-${item.name}-${index}`}>
          <div className="-mx-1 flex items-center rounded px-1 py-0.5 hover:bg-muted/50">
            <span className="mr-1.5 select-none text-muted-foreground">
              {"  ".repeat(level)}
              {item.type === "directory" ? "📁" : "📄"}
            </span>
            <span className="min-w-0 flex-1 break-all">{item.name}</span>
          </div>
          {item.type === "directory" && item.children && (
            <StructurePreview level={level + 1} structure={item.children} />
          )}
        </div>
      ))}
    </div>
  );
}
