import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  RotateCcw,
  Timer,
  XCircle,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import type { ExecutionPlan, ExecutionStatus } from "~/types/filesystem-engine";

interface ExecutionMonitorProps {
  plan: ExecutionPlan;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ExecutionMonitor({
  plan,
  onRetry,
  onBack,
}: ExecutionMonitorProps) {
  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "skipped":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    const variants: Record<
      ExecutionStatus,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      completed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
      skipped: "secondary",
      cancelled: "outline",
    };

    return (
      <Badge className="text-xs" variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) {
      return "N/A";
    }
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  // Calculate statistics
  const stats = {
    total: plan.results.length,
    completed: plan.results.filter((r) => r.status === "completed").length,
    failed: plan.results.filter((r) => r.status === "failed").length,
    skipped: plan.results.filter((r) => r.status === "skipped").length,
    pending: plan.results.filter((r) => r.status === "pending").length,
  };

  const totalDuration =
    plan.endTime && plan.startTime
      ? plan.endTime.getTime() - plan.startTime.getTime()
      : 0;

  return (
    <div className="space-y-6">
      {/* Execution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {plan.status === "completed" && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {plan.status === "failed" && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {plan.status !== "completed" && plan.status !== "failed" && (
              <Clock className="h-5 w-5 text-blue-500" />
            )}
            Execution Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status and Timing */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="font-medium text-muted-foreground text-sm">
                Status
              </div>
              <div className="font-semibold text-lg capitalize">
                {plan.status}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground text-sm">
                Started
              </div>
              <div className="text-sm">
                {plan.startTime ? formatTimestamp(plan.startTime) : "N/A"}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground text-sm">
                Duration
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Timer className="h-3 w-3" />
                {formatDuration(totalDuration)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="text-center">
              <div className="font-bold text-2xl">{stats.total}</div>
              <div className="text-muted-foreground text-sm">Total</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-green-600">
                {stats.completed}
              </div>
              <div className="text-muted-foreground text-sm">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-red-600">
                {stats.failed}
              </div>
              <div className="text-muted-foreground text-sm">Failed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-yellow-600">
                {stats.skipped}
              </div>
              <div className="text-muted-foreground text-sm">Skipped</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-gray-600">
                {stats.pending}
              </div>
              <div className="text-muted-foreground text-sm">Pending</div>
            </div>
          </div>

          {/* Execution Details */}
          <div className="space-y-2">
            <div className="font-medium text-sm">Execution Details:</div>
            <div className="text-muted-foreground text-sm">
              Plan ID: {plan.id}
            </div>
            <div className="text-muted-foreground text-sm">
              Dry Run: {plan.isDryRun ? "Yes" : "No"}
            </div>
            <div className="text-muted-foreground text-sm">
              Rollback Available: {plan.canRollback ? "Yes" : "No"}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {onBack && (
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Preview
              </Button>
            )}
            {plan.status === "failed" && onRetry && (
              <Button onClick={onRetry}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Retry Failed Operations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Execution Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {plan.results.map((result, index) => {
                const change = plan.changes.find(
                  (c) => c.id === result.changeId
                );

                return (
                  <div
                    className="space-y-2 rounded border p-3"
                    key={result.changeId}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}

                      <div className="flex-1">
                        <div className="font-medium">
                          {change?.description || `Change ${index + 1}`}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {change?.path}
                        </div>
                      </div>

                      {getStatusBadge(result.status)}

                      <div className="text-muted-foreground text-xs">
                        {formatDuration(result.duration)}
                      </div>
                    </div>

                    {/* Error Details */}
                    {result.error && (
                      <div className="rounded border border-red-200 bg-red-50 p-2">
                        <div className="mb-1 font-medium text-red-800 text-sm">
                          Error:
                        </div>
                        <div className="text-red-700 text-sm">
                          {result.error}
                        </div>
                      </div>
                    )}

                    {/* Output */}
                    {result.output && (
                      <div className="rounded border bg-gray-50 p-2">
                        <div className="mb-1 font-medium text-gray-800 text-sm">
                          Output:
                        </div>
                        <pre className="whitespace-pre-wrap text-gray-700 text-xs">
                          {result.output}
                        </pre>
                      </div>
                    )}

                    {/* Timing */}
                    <div className="flex gap-4 text-muted-foreground text-xs">
                      <span>Started: {formatTimestamp(result.startTime)}</span>
                      {result.endTime && (
                        <span>Ended: {formatTimestamp(result.endTime)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
