/**
 * Frontend API client for ohmyfs
 * Matches the CLI's API client structure
 */

import { reportApiError } from "./error-reporting";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  retryable?: boolean;
  context?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryConfig?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryableStatuses?: number[];
  };
}

export interface ApiState {
  config: ApiClientConfig;
}

export interface UserProfile {
  _id: string;
  userId: string;
  name: string;
  tier: number;
  storageUsed: number;
  isOnline: boolean;
  lastSeen: number;
  createdAt: number;
  updatedAt: number;
  role?: "admin" | "moderator" | "user";
}

export interface CreateUserProfileRequest {
  userId: string;
  name: string;
  tier?: number;
  storageUsed?: number;
  theme?: "light" | "dark";
  defaultView?: "list" | "grid";
  homeDirectory?: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  tier?: number;
  storageUsed?: number;
  isOnline?: boolean;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "moderator" | "user";
  isActive: boolean;
  cliStarted: boolean;
  lastLogin?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: "admin" | "moderator" | "user";
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: "admin" | "moderator" | "user";
  isActive?: boolean;
  cliStarted?: boolean;
}

export interface UserWithProfiles extends User {
  profiles: UserProfile[];
}

export interface UserProfileQueryParams {
  userId?: string;
  tier?: string;
  minTier?: string;
  maxTier?: string;
  online?: string;
  page?: string;
  limit?: string;
}

export interface UserQueryParams {
  role?: "admin" | "moderator" | "user";
  active?: string;
  page?: string;
  limit?: string;
}

export interface FileOperation {
  _id: string;
  operationId: string;
  type: string;
  userId?: string;
  profileId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
  status?: string;
  size?: number;
  checksum?: string;
  createdAt: number;
  updatedAt: number;
}

export type TaskType =
  | "main"
  | "side"
  | "daily"
  | "weekly"
  | "event"
  | "milestone";
export type TaskCategory =
  | "organization"
  | "backup"
  | "sharing"
  | "analysis"
  | "automation"
  | "maintenance"
  | "security"
  | "custom";
export type TaskDifficulty = "easy" | "medium" | "hard" | "expert";

export interface TaskObjective {
  type:
    | "organize"
    | "backup"
    | "share"
    | "analyze"
    | "automate"
    | "secure"
    | "custom";
  description: string;
  target: string;
  amount: number;
  currentAmount: number;
  completed: boolean;
}

export interface TaskRewards {
  completionPoints: number;
  bonusStorage: number;
  badges?: Array<{
    name: string;
    type: string;
  }>;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  type: TaskType;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  minTier: number;
  maxTier?: number;
  prerequisites?: string[];
  isRepeatable: boolean;
  cooldownMinutes: number;
  objectives: TaskObjective[];
  rewards: TaskRewards;
  isActive: boolean;
  isHidden: boolean;
  completionCount?: number;
  version: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  type: TaskType;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  minTier: number;
  maxTier?: number;
  isRepeatable: boolean;
  cooldownMinutes?: number;
  objectives: Omit<TaskObjective, "currentAmount" | "completed">[];
  rewards: TaskRewards;
  isActive: boolean;
  createdBy: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  type?: TaskType;
  category?: TaskCategory;
  difficulty?: TaskDifficulty;
  minTier?: number;
  maxTier?: number;
  isRepeatable?: boolean;
  cooldownMinutes?: number;
  objectives?: TaskObjective[];
  rewards?: TaskRewards;
  isActive?: boolean;
  isHidden?: boolean;
}

export interface TaskQueryParams {
  type?: string;
  category?: string;
  difficulty?: string;
  minTier?: string;
  maxTier?: string;
  tags?: string;
  isActive?: string;
  page?: string;
  limit?: string;
  [key: string]: string | undefined;
}

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30_000, // 30 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Request Timeout, Too Many Requests, Server errors
};

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

function getRetryConfig(config?: ApiClientConfig["retryConfig"]): RetryConfig {
  return {
    maxRetries: config?.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries,
    baseDelay: config?.baseDelay ?? DEFAULT_RETRY_CONFIG.baseDelay,
    maxDelay: config?.maxDelay ?? DEFAULT_RETRY_CONFIG.maxDelay,
    retryableStatuses: config?.retryableStatuses ?? [
      ...DEFAULT_RETRY_CONFIG.retryableStatuses,
    ],
  };
}

function isRetryableError(
  status: number,
  retryableStatuses: number[]
): boolean {
  return retryableStatuses.includes(status);
}

function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const exponentialDelay = baseDelay * 2 ** attempt;
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

function createApiError(
  message: string,
  status?: number,
  context?: Record<string, unknown>
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.name = "ApiError";

  error.retryable = status
    ? isRetryableError(status, DEFAULT_RETRY_CONFIG.retryableStatuses)
    : false;
  error.context = context;

  return error;
}

// biome-ignore lint/suspicious/useAwait: This function is intentionally async for use with await
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createApiState(config: ApiClientConfig): ApiState {
  return {
    config: {
      timeout: 10_000,
      retryConfig: DEFAULT_RETRY_CONFIG,
      ...config,
    },
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex retry logic is necessary for robust API client
async function makeRequest<T = unknown>(
  state: ApiState,
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const retryConfig = getRetryConfig(state.config.retryConfig);
  const url = `${state.config.baseUrl}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      state.config.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      const errorContext: Record<string, unknown> = {
        status: response.status,
        statusText: response.statusText,
        url,
        endpoint,
        attempt: attempt + 1,
      };

      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = `HTTP ${response.status}: ${errorData.error}`;
            errorContext.responseData = errorData;
          }
        }
      } catch (parseError) {
        console.warn("Failed to parse error response:", parseError);
      }

      const apiError = createApiError(
        errorMessage,
        response.status,
        errorContext
      );

      // Skip error reporting for authentication errors (401) as they are handled by application logic
      // Report API error for analytics (only on final attempt to avoid spam)
      if (
        (attempt === retryConfig.maxRetries || !apiError.retryable) &&
        response.status !== 401
      ) {
        reportApiError(apiError, errorContext);
      }

      // If this is the last attempt or error is not retryable, throw
      if (attempt === retryConfig.maxRetries || !apiError.retryable) {
        throw apiError;
      }

      lastError = apiError;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is not a network error or we've exhausted retries, throw
      if (attempt === retryConfig.maxRetries) {
        break;
      }

      // For network errors, always retry
      const isNetworkError =
        error instanceof TypeError && error.message.includes("fetch");
      const isAbortError =
        error instanceof Error && error.name === "AbortError";

      if (!(isNetworkError || isAbortError || (error as ApiError).retryable)) {
        break;
      }
    }

    // Wait before retrying (except on the last attempt)
    if (attempt < retryConfig.maxRetries) {
      const delay = calculateDelay(
        attempt,
        retryConfig.baseDelay,
        retryConfig.maxDelay
      );
      console.warn(
        `Request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms...`,
        lastError?.message
      );
      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw createApiError(
      `Request timeout after ${state.config.timeout}ms`,
      undefined,
      {
        url,
        endpoint,
        timeout: state.config.timeout,
        attempts: retryConfig.maxRetries + 1,
      }
    );
  }

  throw (
    lastError ||
    createApiError("Unknown error occurred during request", undefined, {
      url,
      endpoint,
      attempts: retryConfig.maxRetries + 1,
    })
  );
}

export function healthCheck(state: ApiState): Promise<ApiResponse> {
  return makeRequest(state, "/health");
}

export function getServerStats(
  state: ApiState,
  serverId?: string
): Promise<ApiResponse> {
  const queryString = serverId ? `?serverId=${serverId}` : "";
  return makeRequest(state, `/server/stats${queryString}`);
}

// Authentication API
export function loginUser(
  state: ApiState,
  username: string,
  password: string
): Promise<ApiResponse> {
  return makeRequest(state, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function generateAuthCode(
  state: ApiState,
  userId: string
): Promise<ApiResponse> {
  return makeRequest(state, "/auth/generate-code", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function verifyAuthCode(
  state: ApiState,
  username: string,
  authCode: string
): Promise<ApiResponse> {
  return makeRequest(state, "/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ username, authCode }),
  });
}

// Users API
export function getUsers(
  state: ApiState,
  params?: Record<string, string>
): Promise<ApiResponse> {
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  return makeRequest(state, `/users${queryString}`);
}

export function getUser(state: ApiState, id: string): Promise<ApiResponse> {
  return makeRequest(state, `/users/${id}`);
}

export function createUser(
  state: ApiState,
  data: CreateUserRequest
): Promise<ApiResponse> {
  return makeRequest(state, "/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(
  state: ApiState,
  id: string,
  data: UpdateUserRequest
): Promise<ApiResponse> {
  return makeRequest(state, `/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(state: ApiState, id: string): Promise<ApiResponse> {
  return makeRequest(state, `/users/${id}`, {
    method: "DELETE",
  });
}

export function getUsersWithProfiles(
  state: ApiState,
  userId?: string
): Promise<ApiResponse> {
  const queryString = userId ? `?userId=${userId}` : "";
  return makeRequest(state, `/users/with-profiles${queryString}`);
}

// User Profiles API
export function getUserProfiles(
  state: ApiState,
  params?: Record<string, string>
): Promise<ApiResponse> {
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  return makeRequest(state, `/profiles${queryString}`);
}

export function getUserProfile(
  state: ApiState,
  id: string
): Promise<ApiResponse> {
  return makeRequest(state, `/profiles/${id}`);
}

export function createUserProfile(
  state: ApiState,
  data: CreateUserProfileRequest
): Promise<ApiResponse> {
  return makeRequest(state, "/profiles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUserProfile(
  state: ApiState,
  id: string,
  data: UpdateUserProfileRequest
): Promise<ApiResponse> {
  return makeRequest(state, `/profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUserProfile(
  state: ApiState,
  id: string
): Promise<ApiResponse> {
  return makeRequest(state, `/profiles/${id}`, {
    method: "DELETE",
  });
}

// File Operations API
export function getFileOperations(
  state: ApiState,
  params?: Record<string, string>
): Promise<ApiResponse> {
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  return makeRequest(state, `/operations${queryString}`);
}

export function getFileOperation(
  state: ApiState,
  id: string
): Promise<ApiResponse> {
  return makeRequest(state, `/operations/${id}`);
}

export function createFileOperation(
  state: ApiState,
  data: Record<string, unknown>
): Promise<ApiResponse> {
  return makeRequest(
    state,
    `/operations/${String(data.operationId)}_${String(data.type)}`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export function updateFileOperation(
  state: ApiState,
  id: string,
  data: Record<string, unknown>
): Promise<ApiResponse> {
  return makeRequest(state, `/operations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteFileOperation(
  state: ApiState,
  id: string
): Promise<ApiResponse> {
  return makeRequest(state, `/operations/${id}`, {
    method: "DELETE",
  });
}

// File Operation Status API
export function getFileOperationStatus(
  state: ApiState,
  operationId: string
): Promise<ApiResponse> {
  return makeRequest(state, `/operations/${operationId}/status`);
}

export function updateFileOperationStatus(
  state: ApiState,
  operationId: string,
  data: Record<string, unknown>
): Promise<ApiResponse> {
  return makeRequest(state, `/operations/${operationId}/status`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Server Stats API
export function saveServers(
  state: ApiState,
  data: Record<string, unknown>
): Promise<ApiResponse> {
  return makeRequest(state, "/server/stats", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Check if server is launched and ready for connections
export async function checkServerStatus(
  state: ApiState,
  serverId = "default"
): Promise<{
  isLaunched: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const response = await getServerStats(state, serverId);

    if (!(response.success && response.data)) {
      return {
        isLaunched: false,
        error: "Failed to fetch server statistics",
      };
    }

    const stats = response.data;

    // Check if we have any stats for this server
    if (!Array.isArray(stats) || stats.length === 0) {
      return {
        isLaunched: false,
        error: `No server statistics found for server '${serverId}'`,
      };
    }

    // Get the latest status (stats are ordered by timestamp desc)
    const latestStats = stats[0];

    return {
      isLaunched: latestStats.status === "launched",
      status: latestStats.status,
      error:
        latestStats.status !== "launched"
          ? `Server '${serverId}' is not launched. Current status: ${latestStats.status}`
          : undefined,
    };
  } catch (error) {
    return {
      isLaunched: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error checking server status",
    };
  }
}

// Validation API functions
export function validateUser(
  state: ApiState,
  userId: string
): Promise<ApiResponse> {
  return makeRequest(state, `/users/${userId}`);
}

export function validateUserProfile(
  state: ApiState,
  profileId: string
): Promise<ApiResponse> {
  return makeRequest(state, `/profiles/${profileId}`);
}

// Task API
export function getTasks(
  state: ApiState,
  params?: TaskQueryParams
): Promise<ApiResponse<Task[]>> {
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  return makeRequest(state, `/tasks${queryString}`);
}

export function getTask(
  state: ApiState,
  id: string
): Promise<ApiResponse<Task>> {
  return makeRequest(state, `/tasks/${id}`);
}

export function createTask(
  state: ApiState,
  data: CreateTaskRequest
): Promise<ApiResponse<Task>> {
  return makeRequest(state, "/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(
  state: ApiState,
  id: string,
  data: UpdateTaskRequest
): Promise<ApiResponse<Task>> {
  return makeRequest(state, `/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTask(state: ApiState, id: string): Promise<ApiResponse> {
  return makeRequest(state, `/tasks/${id}`, {
    method: "DELETE",
  });
}

// Chat API
export async function sendChatMessage(
  state: ApiState,
  messages: Array<{
    role: string;
    parts: Array<{
      type: string;
      text: string;
    }>;
  }>
): Promise<Response> {
  const url = `${state.config.baseUrl}/chat`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), state.config.timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${state.config.timeout}ms`);
      }
      throw error;
    }

    throw new Error(`Unknown error: ${String(error)}`);
  }
}

// Title Image API
export async function getTitleImage(
  state: ApiState,
  profileId: string
): Promise<ArrayBuffer> {
  const url = `${state.config.baseUrl}/title-image?profileId=${encodeURIComponent(profileId)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), state.config.timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = `HTTP ${response.status}: ${errorData.error}`;
          }
        }
      } catch {
        // Ignore errors parsing error response
      }
      throw new Error(errorMessage);
    }

    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${state.config.timeout}ms`);
      }
      throw error;
    }

    throw new Error(`Unknown error: ${String(error)}`);
  }
}

// Create singleton instance with proper configuration
const getApiState = (): ApiState => {
  // Use env.ts for type-safe environment variable access
  // In development, use the proxy to avoid CORS issues
  const isDevelopment = import.meta.env.DEV;
  const apiUrl = isDevelopment
    ? "/api/proxy"
    : import.meta.env.VITE_API_URL || "https://api.ohmyfs.com";

  return createApiState({
    baseUrl: apiUrl,
    timeout: 10_000,
  });
};

export const apiState = getApiState();
