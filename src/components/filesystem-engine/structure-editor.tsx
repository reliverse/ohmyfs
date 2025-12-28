import { Code, Edit, File, Folder, Link, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type {
  DirectoryDefinition,
  FileStructureDefinition,
  FileSystemDefinition,
  Variable,
  VariableValues,
} from "~/types/filesystem-engine";

interface StructureEditorProps {
  definition: FileStructureDefinition;
  onDefinitionChange: (definition: FileStructureDefinition) => void;
  variables?: VariableValues;
  onVariablesChange?: (variables: VariableValues) => void;
  readOnly?: boolean;
}

export function StructureEditor({
  definition,
  onDefinitionChange,
  readOnly = false,
}: Omit<StructureEditorProps, "variables" | "onVariablesChange">) {
  const updateDefinition = useCallback(
    (updates: Partial<FileStructureDefinition>) => {
      onDefinitionChange({ ...definition, ...updates });
    },
    [definition, onDefinitionChange]
  );

  const createNewItem = useCallback(
    (type: "directory" | "file" | "symlink"): FileSystemDefinition => {
      switch (type) {
        case "directory":
          return { type: "directory", name: "new-directory", children: [] };
        case "file":
          return { type: "file", name: "new-file.txt" };
        case "symlink":
          return { type: "symlink", name: "new-link", target: "./target" };
        default:
          return { type: "file", name: "new-file.txt" };
      }
    },
    []
  );

  const addStructureItem = useCallback(
    (type: "directory" | "file" | "symlink", parentPath?: string) => {
      const newItem: FileSystemDefinition = createNewItem(type);

      const newDefinition = { ...definition };

      if (parentPath) {
        const findDirectory = (
          items: FileSystemDefinition[],
          targetName: string
        ): DirectoryDefinition | null => {
          return (
            items
              .filter(
                (item): item is DirectoryDefinition => item.type === "directory"
              )
              .find((dir) => {
                if (dir.name === targetName) {
                  return true;
                }
                return dir.children
                  ? findDirectory(dir.children, targetName) !== null
                  : false;
              }) || null
          );
        };

        const targetDir = findDirectory(newDefinition.structure, parentPath);
        if (targetDir) {
          targetDir.children = targetDir.children || [];
          targetDir.children.push(newItem);
        }
      } else {
        newDefinition.structure.push(newItem);
      }

      onDefinitionChange(newDefinition);
    },
    [definition, onDefinitionChange, createNewItem]
  );

  const removeStructureItem = useCallback(
    (path: number[]) => {
      const newDefinition = { ...definition };

      const removeFromArray = (
        items: FileSystemDefinition[],
        pathIndices: number[]
      ): FileSystemDefinition[] => {
        if (pathIndices.length === 1) {
          return items.filter((_, index) => index !== pathIndices[0]);
        }

        const [currentIndex, ...remainingIndices] = pathIndices;
        const item = items[currentIndex];

        if (item.type === "directory") {
          const dir = item;
          dir.children = removeFromArray(dir.children || [], remainingIndices);
        }

        return items;
      };

      newDefinition.structure = removeFromArray(newDefinition.structure, path);
      onDefinitionChange(newDefinition);
    },
    [definition, onDefinitionChange]
  );

  const updateStructureItem = useCallback(
    (path: number[], updates: Partial<FileSystemDefinition>) => {
      const newDefinition = { ...definition };

      const updateInArray = (
        items: FileSystemDefinition[],
        pathIndices: number[]
      ): FileSystemDefinition[] => {
        return items.map((item, index): FileSystemDefinition => {
          if (index === pathIndices[0]) {
            if (pathIndices.length === 1) {
              return { ...item, ...updates } as FileSystemDefinition;
            }
            if (item.type === "directory") {
              const dir = item;
              return {
                ...item,
                children: updateInArray(
                  dir.children || [],
                  pathIndices.slice(1)
                ),
              };
            }
          }
          return item;
        });
      };

      newDefinition.structure = updateInArray(newDefinition.structure, path);
      onDefinitionChange(newDefinition);
    },
    [definition, onDefinitionChange]
  );

  const addVariable = useCallback(() => {
    const newVariable: Variable = {
      name: "newVariable",
      type: "string",
      description: "New variable",
    };

    updateDefinition({
      variables: [...(definition.variables || []), newVariable],
    });
  }, [definition, updateDefinition]);

  const updateVariable = useCallback(
    (index: number, updates: Partial<Variable>) => {
      const newVariables = [...(definition.variables || [])];
      newVariables[index] = { ...newVariables[index], ...updates };
      updateDefinition({ variables: newVariables });
    },
    [definition, updateDefinition]
  );

  const removeVariable = useCallback(
    (index: number) => {
      const newVariables = (definition.variables || []).filter(
        (_, i) => i !== index
      );
      updateDefinition({ variables: newVariables });
    },
    [definition, updateDefinition]
  );

  return (
    <div className="space-y-6">
      {/* Definition Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Structure Definition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="font-medium text-sm" htmlFor="structure-name">
                Name
              </label>
              <Input
                disabled={readOnly}
                id="structure-name"
                onChange={(e) => updateDefinition({ name: e.target.value })}
                value={definition.name}
              />
            </div>
            <div>
              <label
                className="font-medium text-sm"
                htmlFor="structure-version"
              >
                Version
              </label>
              <Input
                disabled={readOnly}
                id="structure-version"
                onChange={(e) => updateDefinition({ version: e.target.value })}
                value={definition.version}
              />
            </div>
          </div>

          <div>
            <label
              className="font-medium text-sm"
              htmlFor="structure-base-path"
            >
              Base Path
            </label>
            <Input
              disabled={readOnly}
              id="structure-base-path"
              onChange={(e) => updateDefinition({ basePath: e.target.value })}
              placeholder="/path/to/project"
              value={definition.basePath}
            />
          </div>

          <div>
            <label
              className="font-medium text-sm"
              htmlFor="structure-description"
            >
              Description
            </label>
            <Textarea
              disabled={readOnly}
              id="structure-description"
              onChange={(e) =>
                updateDefinition({ description: e.target.value })
              }
              placeholder="Describe what this structure represents..."
              value={definition.description || ""}
            />
          </div>
        </CardContent>
      </Card>

      {/* Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Variables</span>
            {!readOnly && (
              <Button onClick={addVariable} size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                Add Variable
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {definition.variables && definition.variables.length > 0 ? (
            <div className="space-y-3">
              {definition.variables.map((variable, index) => (
                <div
                  className="flex items-center gap-3 rounded border p-3"
                  key={`${variable.name}-${index}`}
                >
                  <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                    <Input
                      disabled={readOnly}
                      onChange={(e) =>
                        updateVariable(index, { name: e.target.value })
                      }
                      placeholder="Variable name"
                      value={variable.name}
                    />
                    <Select
                      disabled={readOnly}
                      onValueChange={(value) => {
                        if (value) {
                          updateVariable(index, {
                            type: value as
                              | "string"
                              | "number"
                              | "boolean"
                              | "path",
                          });
                        }
                      }}
                      value={variable.type}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="path">Path</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      disabled={readOnly}
                      onChange={(e) =>
                        updateVariable(index, { defaultValue: e.target.value })
                      }
                      placeholder="Default value"
                      value={
                        variable.defaultValue
                          ? String(variable.defaultValue)
                          : ""
                      }
                    />
                  </div>
                  {!readOnly && (
                    <Button
                      onClick={() => removeVariable(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No variables defined</p>
          )}
        </CardContent>
      </Card>

      {/* Structure Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>File Structure</span>
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  onClick={() => addStructureItem("directory")}
                  size="sm"
                  variant="outline"
                >
                  <Folder className="mr-1 h-4 w-4" />
                  Add Directory
                </Button>
                <Button
                  onClick={() => addStructureItem("file")}
                  size="sm"
                  variant="outline"
                >
                  <File className="mr-1 h-4 w-4" />
                  Add File
                </Button>
                <Button
                  onClick={() => addStructureItem("symlink")}
                  size="sm"
                  variant="outline"
                >
                  <Link className="mr-1 h-4 w-4" />
                  Add Symlink
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StructureTree
            items={definition.structure}
            onAddItem={addStructureItem}
            onRemoveItem={removeStructureItem}
            onUpdateItem={updateStructureItem}
            path={[]}
            readOnly={readOnly}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface StructureTreeProps {
  items: FileSystemDefinition[];
  onAddItem: (
    type: "directory" | "file" | "symlink",
    parentPath?: string
  ) => void;
  onRemoveItem: (path: number[]) => void;
  onUpdateItem: (
    path: number[],
    updates: Partial<FileSystemDefinition>
  ) => void;
  readOnly?: boolean;
  path: number[];
}

function StructureTree({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  readOnly = false,
  path,
}: StructureTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((itemPath: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(itemPath)) {
        next.delete(itemPath);
      } else {
        next.add(itemPath);
      }
      return next;
    });
  }, []);

  if (!items || items.length === 0) {
    return (
      <p className="text-muted-foreground italic">No items in this directory</p>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => {
        const itemPath = [...path, index];
        const pathKey = itemPath.join("-");
        const isExpanded = expandedDirs.has(pathKey);

        return (
          <div className="border-muted border-l-2 pl-4" key={pathKey}>
            <div className="flex items-center gap-2 py-1">
              {item.type === "directory" && (
                <Button
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpanded(pathKey)}
                  size="sm"
                  variant="ghost"
                >
                  <Folder className="h-4 w-4" />
                </Button>
              )}
              {item.type === "file" && (
                <File className="h-4 w-4 text-blue-500" />
              )}
              {item.type === "symlink" && (
                <Link className="h-4 w-4 text-purple-500" />
              )}

              <span className="flex-1 font-medium">{item.name}</span>

              <Badge className="text-xs" variant="secondary">
                {item.type}
              </Badge>
              {!readOnly && (
                <div className="flex gap-1">
                  <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => onRemoveItem(itemPath)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {item.type === "directory" && isExpanded && (
              <div className="mt-2 ml-6">
                <StructureTree
                  items={(item as DirectoryDefinition).children || []}
                  onAddItem={onAddItem}
                  onRemoveItem={onRemoveItem}
                  onUpdateItem={onUpdateItem}
                  path={itemPath}
                  readOnly={readOnly}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
