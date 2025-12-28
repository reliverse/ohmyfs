import { Loader2Icon } from "lucide-react";
import { cn } from "~/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      role="status"
      {...props}
    />
  );
}

// Loading overlay component for full-screen or section loading
interface LoadingOverlayProps {
  children?: React.ReactNode;
  message?: string;
  fullscreen?: boolean;
  className?: string;
}

function LoadingOverlay({
  children,
  message = "Loading...",
  fullscreen = false,
  className,
}: LoadingOverlayProps) {
  const baseClasses = fullscreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    : "flex items-center justify-center p-8";

  return (
    <div aria-live="polite" className={cn(baseClasses, className)}>
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8" />
        {message && (
          <p className="animate-pulse text-muted-foreground text-sm">
            {message}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

// Inline loading component for buttons and small areas
interface InlineLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function InlineLoading({
  message,
  size = "md",
  className,
}: InlineLoadingProps) {
  const sizeClasses = {
    sm: "size-3",
    md: "size-4",
    lg: "size-6",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner className={sizeClasses[size]} />
      {message && (
        <span className="text-muted-foreground text-sm">{message}</span>
      )}
    </div>
  );
}

export { Spinner, LoadingOverlay, InlineLoading };
