/**
 * Centralized error reporting and analytics service
 * Handles error collection, categorization, and reporting to external services
 */

import { toast } from "sonner";

export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userId?: string;
  sessionId?: string;
  userAgent: string;
  url: string;
  platform: string;
}

export type ErrorCategory =
  | "network"
  | "auth"
  | "ui"
  | "api"
  | "validation"
  | "unknown";

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

class ErrorReportingService {
  private reports: ErrorReport[] = [];
  private readonly maxStoredReports = 50;
  private readonly sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredReports();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredReports(): void {
    try {
      const stored = localStorage.getItem("error_reports");
      if (stored) {
        this.reports = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load stored error reports:", error);
      this.reports = [];
    }
  }

  private saveReports(): void {
    try {
      localStorage.setItem("error_reports", JSON.stringify(this.reports));
    } catch (error) {
      console.warn("Failed to save error reports:", error);
    }
  }

  private categorizeError(
    error: Error,
    context?: Record<string, unknown>
  ): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    // API errors
    if (
      context?.status ||
      message.includes("http") ||
      message.includes("fetch")
    ) {
      return "api";
    }

    // Network errors
    if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("timeout")
    ) {
      return "network";
    }

    // Authentication errors
    if (
      message.includes("auth") ||
      message.includes("login") ||
      message.includes("token") ||
      message.includes("unauthorized")
    ) {
      return "auth";
    }

    // UI/Rendering errors
    if (
      stack.includes("react") ||
      message.includes("render") ||
      message.includes("component")
    ) {
      return "ui";
    }

    // Validation errors
    if (
      message.includes("validation") ||
      message.includes("invalid") ||
      message.includes("required")
    ) {
      return "validation";
    }

    return "unknown";
  }

  private determineSeverity(
    category: ErrorCategory,
    error: Error,
    context?: Record<string, unknown>
  ): ErrorSeverity {
    // Critical errors that prevent core functionality
    if (category === "auth" && context?.loginAttempt) {
      return "high";
    }

    // Network errors during important operations
    if (category === "network" && context?.critical) {
      return "high";
    }

    // API errors with 5xx status codes
    if (
      category === "api" &&
      typeof context?.status === "number" &&
      context.status >= 500
    ) {
      return "high";
    }

    // UI errors that break the interface
    if (category === "ui" && error.message.includes("render")) {
      return "medium";
    }

    // Default to low severity for other errors
    return "low";
  }

  reportError(
    error: Error,
    context?: Record<string, unknown>,
    userId?: string,
    showToast = true
  ): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const category = this.categorizeError(error, context);
    const severity = this.determineSeverity(category, error, context);

    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      category,
      severity,
      userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      platform: navigator.platform,
    };

    // Add to reports array
    this.reports.push(report);

    // Keep only the most recent reports
    if (this.reports.length > this.maxStoredReports) {
      this.reports.shift();
    }

    // Save to localStorage
    this.saveReports();

    // Send to external service in production
    if (!import.meta.env.DEV) {
      this.sendToExternalService(report);
    }

    // Show user-friendly toast notification
    if (showToast) {
      this.showErrorToast(report);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("Error reported:", report);
    }

    return errorId;
  }

  private showErrorToast(report: ErrorReport): void {
    const getToastMessage = () => {
      switch (report.category) {
        case "network":
          return "Connection Error";
        case "auth":
          return "Authentication Error";
        case "api":
          return "Server Error";
        case "ui":
          return "Display Error";
        case "validation":
          return "Input Error";
        default:
          return "Something went wrong";
      }
    };

    const getToastDescription = () => {
      switch (report.category) {
        case "network":
          return "Please check your internet connection and try again.";
        case "auth":
          return "Please try logging in again.";
        case "api":
          return "Our servers are experiencing issues. Please try again later.";
        case "ui":
          return "The page will reload to fix the issue.";
        case "validation":
          return "Please check your input and try again.";
        default:
          return `Error ID: ${report.id}`;
      }
    };

    toast.error(getToastMessage(), {
      description: getToastDescription(),
      duration: 6000,
      action: {
        label: "Report Issue",
        onClick: () => this.openSupportForm(report),
      },
    });
  }

  private openSupportForm(report: ErrorReport): void {
    const subject = encodeURIComponent(`Error Report: ${report.category}`);
    const body = encodeURIComponent(
      `
Error Details:
- Error ID: ${report.id}
- Category: ${report.category}
- Severity: ${report.severity}
- Timestamp: ${report.timestamp}
- Message: ${report.message}
- URL: ${report.url}

Please describe what you were doing when this error occurred.

Technical Details:
${report.stack ? `Stack Trace:\n${report.stack}` : "No stack trace available"}
${report.context ? `Context:\n${JSON.stringify(report.context, null, 2)}` : ""}
		`.trim()
    );

    open(`mailto:support@ohmyfs.com?subject=${subject}&body=${body}`);
  }

  private sendToExternalService(report: ErrorReport): void {
    // In a real application, this would send to services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - Custom error reporting API

    try {
      // Example: Send to custom API endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });

      console.log("Error report sent to external service:", report.id);
    } catch (error) {
      console.warn("Failed to send error report to external service:", error);
    }
  }

  // Analytics methods
  getReports(options?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    since?: Date;
    limit?: number;
  }): ErrorReport[] {
    let filtered = [...this.reports];

    if (options?.category) {
      filtered = filtered.filter((r) => r.category === options.category);
    }

    if (options?.severity) {
      filtered = filtered.filter((r) => r.severity === options.severity);
    }

    if (options?.since) {
      const since = options.since;
      filtered = filtered.filter((r) => new Date(r.timestamp) >= since);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentErrors: number; // Last 24 hours
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentErrors = this.reports.filter(
      (r) => new Date(r.timestamp) >= oneDayAgo
    ).length;

    const byCategory: Record<ErrorCategory, number> = {
      network: 0,
      auth: 0,
      ui: 0,
      api: 0,
      validation: 0,
      unknown: 0,
    };

    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const report of this.reports) {
      byCategory[report.category]++;
      bySeverity[report.severity]++;
    }

    return {
      total: this.reports.length,
      byCategory,
      bySeverity,
      recentErrors,
    };
  }

  clearReports(): void {
    this.reports = [];
    this.saveReports();
  }

  exportReports(): string {
    return JSON.stringify(this.reports, null, 2);
  }
}

// Create singleton instance
export const errorReporting = new ErrorReportingService();

// Convenience functions for common error reporting patterns
export const reportApiError = (
  error: Error,
  context: {
    status?: number;
    endpoint?: string;
    method?: string;
    [key: string]: unknown;
  },
  userId?: string
) => errorReporting.reportError(error, { ...context, type: "api" }, userId);

export const reportUIError = (
  error: Error,
  context: { component?: string; action?: string; [key: string]: unknown },
  userId?: string
) => errorReporting.reportError(error, { ...context, type: "ui" }, userId);

// React hook for error reporting
export function useErrorReporting() {
  return {
    reportError: errorReporting.reportError.bind(errorReporting),
    reportApiError,
    reportUIError,
    getReports: errorReporting.getReports.bind(errorReporting),
    getErrorStats: errorReporting.getErrorStats.bind(errorReporting),
    clearReports: errorReporting.clearReports.bind(errorReporting),
    exportReports: errorReporting.exportReports.bind(errorReporting),
  };
}
