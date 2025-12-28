/**
 * Custom logger that writes to logs.txt in the project root
 * instead of console.log for better debugging in Tauri apps
 */

interface TauriWindow {
  __TAURI__?: {
    invoke: (
      command: string,
      args?: Record<string, unknown>
    ) => Promise<unknown>;
  };
}
class Logger {
  debug(message: string, ...args: unknown[]) {
    const formattedMessage = this.formatMessage("DEBUG", message, args);
    console.log(`[LOGGER] ${formattedMessage}`);
    this.writeToFile(formattedMessage);
  }

  info(message: string, ...args: unknown[]) {
    const formattedMessage = this.formatMessage("INFO", message, args);
    console.log(`[LOGGER] ${formattedMessage}`);
    this.writeToFile(formattedMessage);
  }

  warn(message: string, ...args: unknown[]) {
    const formattedMessage = this.formatMessage("WARN", message, args);
    console.log(`[LOGGER] ${formattedMessage}`);
    this.writeToFile(formattedMessage);
  }

  error(message: string, ...args: unknown[]) {
    const formattedMessage = this.formatMessage("ERROR", message, args);
    console.log(`[LOGGER] ${formattedMessage}`);
    this.writeToFile(formattedMessage);
  }

  private writeToFile(message: string) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;

      // Try to write to logs.txt in project root using Tauri invoke
      const tauriWindow = window as TauriWindow;
      if (typeof window !== "undefined" && tauriWindow.__TAURI__) {
        tauriWindow.__TAURI__
          .invoke("write_log_file", {
            content: logEntry,
            path: "logs.txt",
          })
          .catch((err: unknown) => {
            console.error("[LOGGER] Failed to write to log file:", err);
          });
      } else {
        // Fallback for non-Tauri environments
        console.log(`[LOG FILE] ${logEntry.trim()}`);
      }
    } catch (error) {
      console.error("[LOGGER] Error in writeToFile:", error);
    }
  }

  private formatMessage(
    level: string,
    message: string,
    args: unknown[]
  ): string {
    let formatted = `${level}: ${message}`;

    if (args.length > 0) {
      // Handle different types of arguments
      const argStrings = args.map((arg) => {
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      });

      formatted += ` ${argStrings.join(" ")}`;
    }

    return formatted;
  }
}

// Create a singleton instance
export const logger = new Logger();
