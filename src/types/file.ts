export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  size?: number;
  modifiedAt?: Date;
  createdAt?: Date;
  permissions?: string;
  extension?: string;
  mimeType?: string;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
}

export interface DirectoryEntry extends FileEntry {
  isDirectory: true;
  children?: FileEntry[];
  childrenCount?: number;
  isExpanded?: boolean;
  isLoading?: boolean;
}

export interface FileViewMode {
  type: "list" | "grid" | "details";
  sortBy: "name" | "size" | "modified" | "created" | "type";
  sortOrder: "asc" | "desc";
  showHidden: boolean;
  groupBy?: "type" | "date" | "size" | "none";
}

export interface FileOperation {
  id: string;
  type:
    | "copy"
    | "move"
    | "delete"
    | "rename"
    | "create"
    | "compress"
    | "extract";
  source: string | string[];
  destination?: string;
  progress: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface FavoriteItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  icon?: string;
  color?: string;
}

export interface RecentItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  accessedAt: Date;
  icon?: string;
}

export interface SearchResult {
  items: FileEntry[];
  totalCount: number;
  query: string;
  filters: SearchFilters;
  isLoading: boolean;
  error?: string;
}

export interface SearchFilters {
  name?: string;
  type?: string[];
  size?: {
    min?: number;
    max?: number;
  };
  modified?: {
    from?: Date;
    to?: Date;
  };
  path?: string;
  includeHidden?: boolean;
}

export interface FileManagerState {
  currentPath: string;
  selectedItems: string[];
  clipboard: {
    items: FileEntry[];
    operation: "copy" | "cut" | null;
  };
  viewMode: FileViewMode;
  favorites: FavoriteItem[];
  recentItems: RecentItem[];
  operations: FileOperation[];
  searchResults?: SearchResult;
  isLoading: boolean;
  error?: string;
}

export interface CloudProvider {
  id: string;
  name: string;
  icon: string;
  isConnected: boolean;
  rootPath: string;
  quota?: {
    used: number;
    total: number;
  };
}

export interface FileManagerSettings {
  defaultViewMode: FileViewMode["type"];
  showHiddenFiles: boolean;
  confirmDelete: boolean;
  doubleClickToOpen: boolean;
  showThumbnails: boolean;
  thumbnailSize: number;
  cloudProviders: CloudProvider[];
  keyboardShortcuts: Record<string, string>;
  theme: "light" | "dark" | "system";
  language: string;
}

// All interfaces are already exported above
