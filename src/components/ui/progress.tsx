import { cn } from "~/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The progress value (0-100)
   */
  value?: number;
  /**
   * The maximum value (default: 100)
   */
  max?: number;
  /**
   * Whether to show the progress value as text
   */
  showValue?: boolean;
  /**
   * Custom value formatter
   */
  valueFormatter?: (value: number, max: number) => string;
  /**
   * Progress variant
   */
  variant?: "default" | "success" | "warning" | "error";
  /**
   * Progress size
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether the progress is indeterminate (animated)
   */
  indeterminate?: boolean;
}

function Progress({
  className,
  value = 0,
  max = 100,
  showValue = false,
  valueFormatter,
  variant = "default",
  size = "md",
  indeterminate = false,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  let displayValue: string | undefined;
  if (valueFormatter) {
    displayValue = valueFormatter(value, max);
  } else if (showValue) {
    displayValue = `${Math.round(percentage)}%`;
  }

  return (
    <div
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuetext={displayValue}
      className={cn("w-full space-y-2", className)}
      role="progressbar"
      {...props}
    >
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-in-out",
            variantClasses[variant],
            indeterminate && "animate-pulse"
          )}
          style={{
            width: indeterminate ? "100%" : `${percentage}%`,
          }}
        />
      </div>
      {displayValue && (
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>Progress</span>
          <span>{displayValue}</span>
        </div>
      )}
    </div>
  );
}

// Circular progress component
interface CircularProgressProps extends Omit<ProgressProps, "size"> {
  /**
   * The size of the circular progress (diameter in pixels)
   */
  size?: number;
  /**
   * Stroke width of the progress circle
   */
  strokeWidth?: number;
  /**
   * Whether to show the value in the center
   */
  showValue?: boolean;
}

function CircularProgress({
  value = 0,
  max = 100,
  size = 40,
  strokeWidth = 4,
  showValue = false,
  variant = "default",
  indeterminate = false,
  className,
  ...props
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantClasses = {
    default: "text-primary",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
  };

  return (
    <div
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={indeterminate ? undefined : value}
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      role="progressbar"
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="-rotate-90 transform"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        {/* Background circle */}
        <circle
          className="text-muted"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          opacity={0.2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className={cn(
            variantClasses[variant],
            indeterminate && "animate-spin"
          )}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={
            indeterminate ? circumference * 0.8 : strokeDashoffset
          }
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          style={{
            transition: indeterminate ? "none" : "stroke-dashoffset 0.3s ease",
          }}
        />
      </svg>
      {showValue && !indeterminate && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-medium text-xs">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

export { Progress, CircularProgress };
