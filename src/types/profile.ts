export interface UserProfile {
  id: string;
  name: string;
  tier: number;
  usageTime: string;
  lastActive: string;
  stats: {
    filesUploaded: number;
    filesDownloaded: number;
    storageUsed: number;
  };
  theme?: "light" | "dark" | "auto";
  age?: number;
  bio?: string;
  preferences?: {
    defaultView: "list" | "grid";
    homeDirectory: string;
    notifications: boolean;
  };
  description?: string;
}

export interface UserProfileFormData {
  name: string;
  theme: "light" | "dark" | "auto";
  age: number;
  bio: string;
  preferences?: {
    defaultView: "list" | "grid";
    homeDirectory: string;
    notifications: boolean;
  };
  description?: string;
}
