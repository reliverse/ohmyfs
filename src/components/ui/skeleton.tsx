import { cn } from "~/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The width of the skeleton. Can be a CSS value or a Tailwind class.
   */
  width?: string | number;
  /**
   * The height of the skeleton. Can be a CSS value or a Tailwind class.
   */
  height?: string | number;
  /**
   * The shape of the skeleton. Defaults to "rectangle".
   */
  variant?: "rectangle" | "circle" | "rounded";
}

export function Skeleton({
  className,
  width,
  height,
  variant = "rectangle",
  ...props
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-muted";

  const variantClasses = {
    rectangle: "",
    circle: "rounded-full",
    rounded: "rounded-md",
  };

  const style: React.CSSProperties = {};
  if (width) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      {...props}
    />
  );
}

// Preset skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {(() => {
        const skeletonLines: React.ReactElement[] = [];
        for (let i = 0; i < lines; i++) {
          skeletonLines.push(
            <Skeleton
              className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
              key={`skeleton-text-line-${i}`}
            />
          );
        }
        return skeletonLines;
      })()}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton height={size} variant="circle" width={size} />;
}

export function SkeletonButton({ width = 80 }: { width?: number }) {
  return <Skeleton className="h-10 rounded-md" width={width} />;
}
