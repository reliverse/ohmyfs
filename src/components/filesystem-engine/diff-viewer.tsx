import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  Info,
  Minus,
  Plus,
  Shield,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import type {
  ChangeType,
  FileSystemChange,
  FileSystemDiff,
} from "~/types/filesystem-engine";

interface DiffViewerProps {
  diff: FileSystemDiff;
  onExecute?: () => void;
  onCancel?: () => void;
  isExecuting?: boolean;
  executionProgress?: number;
}

export function DiffViewer({
  diff,
  onExecute,
  onCancel,
  isExecuting = false,
  executionProgress = 0,
}: DiffViewerProps) {
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(
    new Set()
  );

  const getFileType = (state: { isDirectory?: boolean; isFile?: boolean }) => {
    if (state.isDirectory) {
      return "Directory";
    }
    if (state.isFile) {
      return "File";
    }
    return "Symlink";
  };

  const toggleExpanded = (changeId: string) => {
    setExpandedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  };

  const getChangeIcon = (type: ChangeType) => {
    switch (type) {
      case "create_directory":
      case "create_file":
      case "create_symlink":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "remove_directory":
      case "remove_file":
      case "remove_symlink":
        return <Minus className="h-4 w-4 text-red-500" />;
      case "update_file_content":
      case "update_permissions":
        return <Edit className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSafetyIcon = (change: FileSystemChange) => {
    if (change.isSafe) {
      return <ShieldCheck className="h-4 w-4 text-green-500" />;
    }
    if (change.isDestructive) {
      return <ShieldX className="h-4 w-4 text-red-500" />;
    }
    return <Shield className="h-4 w-4 text-yellow-500" />;
  };

  const getChangeTypeBadge = (type: ChangeType) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      create_directory: "default",
      create_file: "default",
      create_symlink: "default",
      remove_directory: "destructive",
      remove_file: "destructive",
      remove_symlink: "destructive",
      update_file_content: "secondary",
      update_permissions: "secondary",
      no_change: "outline",
    };

    return (
      <Badge className="text-xs" variant={variants[type] || "outline"}>
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {diff.isSafe && <CheckCircle className="h-5 w-5 text-green-500" />}
            {!diff.isSafe && diff.canExecute && (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            {!(diff.isSafe || diff.canExecute) && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Change Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="font-bold text-2xl text-green-600">
                {diff.summary.create}
              </div>
              <div className="text-muted-foreground text-sm">Create</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-blue-600">
                {diff.summary.update}
              </div>
              <div className="text-muted-foreground text-sm">Update</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-red-600">
                {diff.summary.remove}
              </div>
              <div className="text-muted-foreground text-sm">Remove</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-gray-600">
                {diff.summary.total}
              </div>
              <div className="text-muted-foreground text-sm">Total</div>
            </div>
          </div>

          <Separator />

          {/* Safety Assessment */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {diff.isSafe ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="font-medium">
                {diff.isSafe ? "Safe to execute" : "Requires caution"}
              </span>
            </div>

            {diff.summary.destructive > 0 && (
              <div className="text-muted-foreground text-sm">
                {diff.summary.destructive} destructive operation
                {diff.summary.destructive !== 1 ? "s" : ""}
                that will remove or modify existing data
              </div>
            )}

            {diff.warnings.length > 0 && (
              <div className="space-y-1">
                <div className="font-medium text-sm text-yellow-600">
                  Warnings:
                </div>
                {diff.warnings.map((warning) => (
                  <div
                    className="rounded bg-yellow-50 p-2 text-sm text-yellow-700"
                    key={warning}
                  >
                    {warning}
                  </div>
                ))}
              </div>
            )}

            {diff.errors.length > 0 && (
              <div className="space-y-1">
                <div className="font-medium text-red-600 text-sm">Errors:</div>
                {diff.errors.map((error) => (
                  <div
                    className="rounded bg-red-50 p-2 text-red-700 text-sm"
                    key={error}
                  >
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Execution Progress */}
          {isExecuting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Executing changes...
                </span>
                <span className="text-muted-foreground text-sm">
                  {executionProgress}%
                </span>
              </div>
              <Progress className="w-full" value={executionProgress} />
            </div>
          )}

          {/* Action Buttons */}
          {!isExecuting && diff.canExecute && (
            <div className="flex gap-2 pt-4">
              <Button disabled={!diff.canExecute} onClick={onExecute}>
                Execute Changes
              </Button>
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Changes List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {diff.changes.map((change) => {
              const isExpanded = expandedChanges.has(change.id);

              return (
                <Collapsible key={change.id}>
                  <CollapsibleTrigger>
                    <Button
                      className="h-auto w-full justify-start p-3"
                      onClick={() => toggleExpanded(change.id)}
                      variant="ghost"
                    >
                      <div className="flex w-full items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}

                        {getChangeIcon(change.type)}

                        <div className="flex-1 text-left">
                          <div className="font-medium">
                            {change.description}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {change.path}
                          </div>
                        </div>

                        {getSafetyIcon(change)}

                        {getChangeTypeBadge(change.type)}
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-2 ml-8 space-y-2 rounded bg-muted/50 p-3">
                      <div className="text-sm">
                        <strong>Reason:</strong> {change.reason}
                      </div>

                      {(change.warnings?.length ?? 0) > 0 && (
                        <div className="space-y-1">
                          <div className="font-medium text-sm text-yellow-600">
                            Warnings:
                          </div>
                          {change.warnings?.map((warning) => (
                            <div
                              className="text-sm text-yellow-700"
                              key={warning}
                            >
                              • {warning}
                            </div>
                          ))}
                        </div>
                      )}

                      {(change.errors?.length ?? 0) > 0 && (
                        <div className="space-y-1">
                          <div className="font-medium text-red-600 text-sm">
                            Errors:
                          </div>
                          {change.errors?.map((error) => (
                            <div className="text-red-700 text-sm" key={error}>
                              • {error}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Show before/after state */}
                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        {change.oldState && (
                          <div>
                            <div className="mb-1 font-medium text-red-600">
                              Before:
                            </div>
                            <div className="rounded bg-red-50 p-2 text-red-800">
                              {getFileType(change.oldState)} -{" "}
                              {change.oldState.name}
                            </div>
                          </div>
                        )}

                        {change.newState && (
                          <div>
                            <div className="mb-1 font-medium text-green-600">
                              After:
                            </div>
                            <div className="rounded bg-green-50 p-2 text-green-800">
                              {getFileType(change.newState)} -{" "}
                              {change.newState.name}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {diff.changes.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                <p>No changes needed - filesystem matches desired state</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
