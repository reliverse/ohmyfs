/**
 * Utility functions for normalizing API errors into user-friendly messages
 */

function handlePatternErrors(
  errorLower: string,
  context?: "login" | "signup"
): string | null {
  if (
    errorLower.includes("pattern") ||
    errorLower.includes("did not match") ||
    errorLower.includes("validation failed")
  ) {
    if (context === "login") {
      return "Invalid username or password";
    }
    if (errorLower.includes("email")) {
      return "Please enter a valid email address";
    }
    if (errorLower.includes("password")) {
      return "Password does not meet requirements";
    }
    if (errorLower.includes("username")) {
      return "Username does not meet requirements";
    }
    return "Please check your input and try again";
  }
  return null;
}

function handleAuthErrors(
  errorLower: string,
  context?: "login" | "signup"
): string | null {
  if (
    errorLower.includes("invalid") ||
    errorLower.includes("incorrect") ||
    errorLower.includes("wrong") ||
    errorLower.includes("unauthorized") ||
    errorLower.includes("authentication failed")
  ) {
    return context === "login"
      ? "Invalid username or password"
      : "Invalid credentials";
  }
  return null;
}

function handleNotFoundErrors(
  errorLower: string,
  context?: "login" | "signup"
): string | null {
  if (
    errorLower.includes("not found") ||
    errorLower.includes("user does not exist") ||
    errorLower.includes("does not exist")
  ) {
    return context === "login"
      ? "Invalid username or password"
      : "User not found";
  }
  return null;
}

function handleDuplicateErrors(errorLower: string): string | null {
  if (
    errorLower.includes("already exists") ||
    errorLower.includes("already taken") ||
    errorLower.includes("duplicate")
  ) {
    if (errorLower.includes("username")) {
      return "Username is already taken";
    }
    if (errorLower.includes("email")) {
      return "Email is already registered";
    }
    return "This account already exists";
  }
  return null;
}

function handleNetworkErrors(errorLower: string): string | null {
  if (
    errorLower.includes("network") ||
    errorLower.includes("fetch") ||
    errorLower.includes("connection") ||
    errorLower.includes("failed to fetch")
  ) {
    return "Unable to connect to server. Please check your internet connection.";
  }
  return null;
}

function handle401Error(context?: "login" | "signup"): string {
  return context === "login"
    ? "Invalid username or password"
    : "You are not authorized to perform this action";
}

function handle4xxErrors(
  errorLower: string,
  context?: "login" | "signup"
): string | null {
  if (errorLower.includes("401") || errorLower.includes("unauthorized")) {
    return handle401Error(context);
  }
  if (errorLower.includes("403") || errorLower.includes("forbidden")) {
    return "You don't have permission to perform this action";
  }
  if (errorLower.includes("404") || errorLower.includes("not found")) {
    return "The requested resource was not found";
  }
  if (errorLower.includes("405") || errorLower.includes("method not allowed")) {
    return "The API endpoint does not accept this request method. Please check your server configuration.";
  }
  if (errorLower.includes("409") || errorLower.includes("conflict")) {
    return "This account already exists";
  }
  if (errorLower.includes("422") || errorLower.includes("unprocessable")) {
    return "Please check your input and try again";
  }
  if (errorLower.includes("429") || errorLower.includes("too many")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  return null;
}

function handle5xxErrors(errorLower: string): string | null {
  if (
    errorLower.includes("500") ||
    errorLower.includes("internal server error")
  ) {
    return "Server error. Please try again later.";
  }
  if (
    errorLower.includes("503") ||
    errorLower.includes("service unavailable")
  ) {
    return "Service is temporarily unavailable. Please try again later.";
  }
  return null;
}

function handleHttpStatusErrors(
  errorLower: string,
  context?: "login" | "signup"
): string | null {
  const fourxxResult = handle4xxErrors(errorLower, context);
  if (fourxxResult) {
    return fourxxResult;
  }

  const fivexxResult = handle5xxErrors(errorLower);
  if (fivexxResult) {
    return fivexxResult;
  }

  return null;
}

function handleFieldSpecificErrors(errorLower: string): string | null {
  if (
    errorLower.includes("password") &&
    (errorLower.includes("weak") ||
      errorLower.includes("short") ||
      errorLower.includes("length") ||
      errorLower.includes("minimum"))
  ) {
    return "Password is too weak. Please use a stronger password.";
  }
  if (
    errorLower.includes("email") &&
    (errorLower.includes("invalid") ||
      errorLower.includes("format") ||
      errorLower.includes("malformed"))
  ) {
    return "Please enter a valid email address";
  }
  return null;
}

/**
 * Normalizes API error messages into user-friendly text
 */
export function normalizeErrorMessage(
  error: string | undefined,
  context?: "login" | "signup"
): string {
  if (!error) {
    return context === "login"
      ? "Invalid username or password"
      : "An error occurred. Please try again.";
  }

  const errorLower = error.toLowerCase();

  // Try each error handler in order and return first match
  const patternResult = handlePatternErrors(errorLower, context);
  if (patternResult) {
    return patternResult;
  }

  const authResult = handleAuthErrors(errorLower, context);
  if (authResult) {
    return authResult;
  }

  const notFoundResult = handleNotFoundErrors(errorLower, context);
  if (notFoundResult) {
    return notFoundResult;
  }

  const duplicateResult = handleDuplicateErrors(errorLower);
  if (duplicateResult) {
    return duplicateResult;
  }

  const networkResult = handleNetworkErrors(errorLower);
  if (networkResult) {
    return networkResult;
  }

  const httpResult = handleHttpStatusErrors(errorLower, context);
  if (httpResult) {
    return httpResult;
  }

  const fieldResult = handleFieldSpecificErrors(errorLower);
  if (fieldResult) {
    return fieldResult;
  }

  // Return original error if no pattern matches, but clean it up
  return error.charAt(0).toUpperCase() + error.slice(1);
}

/**
 * Normalizes authentication errors specifically
 */
export function normalizeAuthError(
  error: string | undefined,
  action: "login" | "signup"
): string {
  return normalizeErrorMessage(error, action);
}
