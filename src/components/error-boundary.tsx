import { AlertCircle, Bug, RefreshCw, Shield, Wifi } from "lucide-react";
import { Component, type ReactNode } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

type ErrorCategory = "network" | "auth" | "ui" | "unknown";

interface ErrorInfo {
  category: ErrorCategory;
  userMessage: string;
  technicalDetails?: string;
  recoveryActions: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || `err_${Date.now()}`;

    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    if (!import.meta.env.DEV) {
      this.reportError(error, errorInfo, errorId);
    }

    this.props.onError?.(error, errorInfo);

    toast.error("An unexpected error occurred", {
      description: "Check the error details below for more information",
      duration: 5000,
    });
  }

  private readonly reportError = (
    error: Error,
    errorInfo: React.ErrorInfo,
    errorId: string
  ) => {
    const errorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      const existingReports = JSON.parse(
        localStorage.getItem("error_reports") || "[]"
      );
      existingReports.push(errorReport);
      if (existingReports.length > 10) {
        existingReports.shift();
      }
      localStorage.setItem("error_reports", JSON.stringify(existingReports));
    } catch {
      // ignore
    }
  };

  private readonly categorizeError = (error: Error): ErrorInfo => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection")
    ) {
      return {
        category: "network",
        userMessage: "Connection Error",
        technicalDetails:
          "Unable to connect to the server. Please check your internet connection.",
        recoveryActions: [
          {
            label: "Check Connection",
            action: () => open("https://www.google.com"),
            primary: true,
          },
          {
            label: "Retry",
            action: this.handleRetry,
          },
          {
            label: "Reload Page",
            action: () => window.location.reload(),
          },
        ],
      };
    }

    // Authentication errors
    if (
      message.includes("auth") ||
      message.includes("login") ||
      message.includes("token")
    ) {
      return {
        category: "auth",
        userMessage: "Authentication Error",
        technicalDetails:
          "There was a problem with your login session. Please try logging in again.",
        recoveryActions: [
          {
            label: "Login Again",
            action: () => {
              window.location.href = "/auth";
            },
            primary: true,
          },
          {
            label: "Clear Cache",
            action: () => {
              localStorage.clear();
              window.location.reload();
            },
          },
        ],
      };
    }

    // UI/Rendering errors
    if (
      stack.includes("react") ||
      message.includes("render") ||
      message.includes("component")
    ) {
      return {
        category: "ui",
        userMessage: "Display Error",
        technicalDetails:
          "There was a problem displaying the interface. This is usually temporary.",
        recoveryActions: [
          {
            label: "Reload Page",
            action: () => window.location.reload(),
            primary: true,
          },
          {
            label: "Go Home",
            action: () => {
              window.location.href = "/";
            },
          },
        ],
      };
    }

    // Unknown errors
    return {
      category: "unknown",
      userMessage: "Unexpected Error",
      technicalDetails:
        "An unexpected error occurred. Our team has been notified.",
      recoveryActions: [
        {
          label: "Reload Page",
          action: () => window.location.reload(),
          primary: true,
        },
        {
          label: "Go Home",
          action: () => {
            window.location.href = "/";
          },
        },
        {
          label: "Report Issue",
          action: () => {
            const subject = encodeURIComponent("OhMyFS Error Report");
            const body = encodeURIComponent(
              `Error ID: ${this.state.errorId}\nError: ${error.message}\nPlease describe what you were doing when this error occurred.`
            );
            open(`mailto:support@ohmyfs.com?subject=${subject}&body=${body}`);
          },
        },
      ],
    };
  };

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prev.retryCount + 1,
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorInfo = this.categorizeError(this.state.error);
      const canRetry = this.state.retryCount < this.maxRetries;

      const getIcon = () => {
        switch (errorInfo.category) {
          case "network":
            return <Wifi className="h-6 w-6" />;
          case "auth":
            return <Shield className="h-6 w-6" />;
          default:
            return <Bug className="h-6 w-6" />;
        }
      };

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-6">
            <Alert className="border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                {getIcon()}
                {errorInfo.userMessage}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {errorInfo.technicalDetails}
              </AlertDescription>
            </Alert>

            {this.state.errorId && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-muted-foreground text-xs">
                  Error ID:{" "}
                  <code className="font-mono">{this.state.errorId}</code>
                </p>
                {this.state.retryCount > 0 && (
                  <p className="mt-1 text-muted-foreground text-xs">
                    Retry attempts: {this.state.retryCount}/{this.maxRetries}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {errorInfo.recoveryActions.map((action, _index) => (
                <Button
                  className="w-full"
                  disabled={action.label === "Retry" && !canRetry}
                  key={action.label}
                  onClick={action.action}
                  variant={action.primary ? "default" : "outline"}
                >
                  {action.label === "Retry" && (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Technical details for debugging */}
            {import.meta.env.DEV && (
              <details className="rounded-lg border bg-muted/50 p-3">
                <summary className="cursor-pointer font-medium text-sm">
                  Technical Details
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-muted-foreground text-xs">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
