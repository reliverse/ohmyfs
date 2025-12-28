import { Activity, Cpu, HardDrive, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useMemoryMonitor } from "~/hooks/use-performance";

interface PerformanceIndicatorProps {
  fileCount?: number;
  renderTime?: number;
  virtualized?: boolean;
  className?: string;
}

export function PerformanceIndicator({
  fileCount,
  renderTime,
  virtualized,
  className,
}: PerformanceIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const memoryInfo = useMemoryMonitor();

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div className={className}>
      <Button
        className="h-6 px-2 text-xs opacity-50 hover:opacity-100"
        onClick={() => setIsExpanded(!isExpanded)}
        size="sm"
        variant="ghost"
      >
        <Activity className="mr-1 h-3 w-3" />
        Perf
      </Button>

      {isExpanded && (
        <Card className="absolute right-0 bottom-full z-50 mb-2 w-64 border bg-background/95 p-3 shadow-lg backdrop-blur-sm">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">Performance</span>
              <Badge
                className="text-xs"
                variant={virtualized ? "default" : "secondary"}
              >
                {virtualized ? "Virtual" : "Standard"}
              </Badge>
            </div>

            {fileCount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Files
                </span>
                <span>{fileCount.toLocaleString()}</span>
              </div>
            )}

            {renderTime !== undefined && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Render
                </span>
                <span>{renderTime.toFixed(1)}ms</span>
              </div>
            )}

            {memoryInfo && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    Memory
                  </span>
                  <span>{memoryInfo.used}MB</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${(memoryInfo.used / memoryInfo.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-center text-muted-foreground">
                  {memoryInfo.used}MB / {memoryInfo.total}MB
                </div>
              </div>
            )}

            <div className="border-t pt-1 text-center">
              <span className="text-muted-foreground">Development Mode</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
