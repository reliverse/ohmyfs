import { CheckCircle, Clock, Pause, X, XCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";
import type { FileOperation } from "~/types/file";

interface ProgressIndicatorProps {
  operation: FileOperation;
  onCancel?: (operationId: string) => void;
}

export function ProgressIndicator({
  operation,
  onCancel,
}: ProgressIndicatorProps) {
  const getStatusIcon = () => {
    switch (operation.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-gray-500" />;
      case "running":
        return (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        );
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Pause className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (operation.status) {
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      case "running":
        return "Running";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getOperationDescription = () => {
    const sourceCount = Array.isArray(operation.source)
      ? operation.source.length
      : 1;
    const sourceText = sourceCount > 1 ? `${sourceCount} items` : "item";

    switch (operation.type) {
      case "copy":
        return `Copying ${sourceText} to ${operation.destination}`;
      case "move":
        return `Moving ${sourceText} to ${operation.destination}`;
      case "delete":
        return `Deleting ${sourceText}`;
      case "rename":
        return "Renaming item";
      case "create":
        return `Creating ${sourceText}`;
      case "compress":
        return `Compressing ${sourceText}`;
      case "extract":
        return `Extracting ${sourceText}`;
      default:
        return `${operation.type} operation`;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        operation.status === "completed" &&
          "border-green-200 bg-green-50 dark:bg-green-950/20",
        operation.status === "failed" &&
          "border-red-200 bg-red-50 dark:bg-red-950/20",
        operation.status === "running" &&
          "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
        operation.status === "pending" &&
          "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
        operation.status === "cancelled" &&
          "border-gray-200 bg-gray-50 dark:bg-gray-950/20"
      )}
    >
      {/* Status Icon */}
      {getStatusIcon()}

      {/* Operation Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate font-medium text-sm">
            {getOperationDescription()}
          </p>
          <span className="ml-2 shrink-0 text-muted-foreground text-xs">
            {getStatusText()}
          </span>
        </div>

        {/* Progress Bar */}
        {operation.status === "running" && (
          <Progress className="mt-2 h-1" value={operation.progress} />
        )}

        {/* Error Message */}
        {operation.error && (
          <p
            className="mt-1 truncate text-red-600 text-xs"
            title={operation.error}
          >
            {operation.error}
          </p>
        )}

        {/* Timestamps */}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            Started: {formatTime(operation.startTime)}
          </span>
          {operation.endTime && (
            <>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-muted-foreground text-xs">
                Ended: {formatTime(operation.endTime)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Cancel Button */}
      {(operation.status === "pending" || operation.status === "running") &&
        onCancel && (
          <Button
            className="h-6 w-6 shrink-0 p-0"
            onClick={() => onCancel(operation.id)}
            size="sm"
            title="Cancel operation"
            variant="ghost"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
    </div>
  );
}
