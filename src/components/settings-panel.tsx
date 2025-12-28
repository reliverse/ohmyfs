import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  Download,
  Eye,
  HardDrive,
  Palette,
  Shield,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  useFileManagerActions,
  useFileManagerState,
} from "../contexts/file-manager-context";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";

interface FileManagerSettings {
  showHiddenFiles: boolean;
  confirmDelete: boolean;
  showThumbnails: boolean;
  thumbnailSize: number;
  defaultViewMode: "list" | "grid" | "details";
  sortBy: "name" | "size" | "modified" | "created" | "type";
  sortOrder: "asc" | "desc";
  groupBy: "type" | "date" | "size" | "none";
  autoRefresh: boolean;
  refreshInterval: number;
  theme: "light" | "dark" | "system";
  language: string;
}

interface SettingSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}

interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingSection({
  icon: Icon,
  title,
  description,
  children,
}: SettingSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="font-medium text-sm">{label}</Label>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function SettingsPanel() {
  const { setViewMode } = useFileManagerActions();
  const { viewMode: currentViewMode } = useFileManagerState();

  const [settings, setSettings] = useState<FileManagerSettings>({
    showHiddenFiles: currentViewMode.showHidden,
    confirmDelete: true,
    showThumbnails: true,
    thumbnailSize: 120,
    defaultViewMode: currentViewMode.type,
    sortBy: currentViewMode.sortBy,
    sortOrder: currentViewMode.sortOrder,
    groupBy: currentViewMode.groupBy || "none",
    autoRefresh: false,
    refreshInterval: 30,
    theme: "system",
    language: "en",
  });

  const updateViewModeSetting = <K extends keyof FileManagerSettings>(
    key: K,
    value: FileManagerSettings[K] | null
  ) => {
    const newViewMode = { ...currentViewMode };

    if (value !== null) {
      switch (key) {
        case "showHiddenFiles":
          newViewMode.showHidden = value as boolean;
          break;
        case "defaultViewMode":
          newViewMode.type = value as "list" | "grid" | "details";
          break;
        case "sortBy":
          newViewMode.sortBy = value as
            | "name"
            | "size"
            | "modified"
            | "created"
            | "type";
          break;
        case "sortOrder":
          newViewMode.sortOrder = value as "asc" | "desc";
          break;
        case "groupBy":
          newViewMode.groupBy =
            value === "none" ? undefined : (value as "type" | "size" | "date");
          break;
        default:
          // No action needed for non-view related settings
          break;
      }
    }

    setViewMode(newViewMode);
  };

  const updateSetting = <K extends keyof FileManagerSettings>(
    key: K,
    value: FileManagerSettings[K] | null
  ) => {
    if (value !== null) {
      setSettings((prev) => ({ ...prev, [key]: value }));
    }

    // Update file manager state for view-related settings
    const viewRelatedKeys: (keyof FileManagerSettings)[] = [
      "showHiddenFiles",
      "defaultViewMode",
      "sortBy",
      "sortOrder",
      "groupBy",
    ];

    if (viewRelatedKeys.includes(key)) {
      updateViewModeSetting(key, value);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h2 className="mb-2 font-bold text-3xl">File Manager Settings</h2>
        <p className="text-muted-foreground">
          Customize your file browsing experience
        </p>
      </div>

      {/* View Settings */}
      <SettingSection
        description="Customize how files are displayed"
        icon={Eye}
        title="View Options"
      >
        <div className="space-y-4">
          <ToggleSetting
            checked={settings.showHiddenFiles}
            description="Display files and folders that start with a dot"
            label="Show hidden files"
            onChange={(checked) => updateSetting("showHiddenFiles", checked)}
          />

          <ToggleSetting
            checked={settings.showThumbnails}
            description="Display image thumbnails in file lists"
            label="Show thumbnails"
            onChange={(checked) => updateSetting("showThumbnails", checked)}
          />

          <div className="space-y-2">
            <Label>Default view mode</Label>
            <Select
              onValueChange={(value) => updateSetting("defaultViewMode", value)}
              value={settings.defaultViewMode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="details">Details</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select
              onValueChange={(value) => updateSetting("sortBy", value)}
              value={settings.sortBy}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="modified">Modified date</SelectItem>
                <SelectItem value="created">Created date</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort order</Label>
            <Select
              onValueChange={(value) => updateSetting("sortOrder", value)}
              value={settings.sortOrder}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Group by</Label>
            <Select
              onValueChange={(value) => updateSetting("groupBy", value)}
              value={settings.groupBy}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingSection>

      {/* Behavior Settings */}
      <SettingSection
        description="Configure file manager behavior"
        icon={Shield}
        title="Behavior"
      >
        <div className="space-y-4">
          <ToggleSetting
            checked={settings.confirmDelete}
            description="Ask for confirmation before deleting files"
            label="Confirm delete operations"
            onChange={(checked) => updateSetting("confirmDelete", checked)}
          />

          <ToggleSetting
            checked={settings.autoRefresh}
            description="Automatically refresh directory contents"
            label="Auto-refresh directories"
            onChange={(checked) => updateSetting("autoRefresh", checked)}
          />

          {settings.autoRefresh && (
            <div className="space-y-2">
              <Label>Refresh interval (seconds)</Label>
              <Select
                onValueChange={(value) =>
                  value &&
                  updateSetting("refreshInterval", Number.parseInt(value, 10))
                }
                value={settings.refreshInterval.toString()}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </SettingSection>

      {/* Performance Settings */}
      <SettingSection
        description="Optimize performance for large directories"
        icon={Zap}
        title="Performance"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Thumbnail size</Label>
            <div className="flex items-center gap-4">
              <Slider
                className="flex-1"
                max={256}
                min={64}
                onValueChange={(values) =>
                  updateSetting(
                    "thumbnailSize",
                    Array.isArray(values) ? values[0] : values
                  )
                }
                step={16}
                value={[settings.thumbnailSize]}
              />
              <span className="w-12 text-muted-foreground text-sm">
                {settings.thumbnailSize}px
              </span>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Appearance */}
      <SettingSection
        description="Customize the look and feel"
        icon={Palette}
        title="Appearance"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              onValueChange={(value) => updateSetting("theme", value)}
              value={settings.theme}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              onValueChange={(value) =>
                value && updateSetting("language", value)
              }
              value={settings.language}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingSection>

      {/* Cloud Storage */}
      <SettingSection
        description="Connect cloud storage providers"
        icon={Cloud}
        title="Cloud Storage"
      >
        <div className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Cloud storage integration coming soon...
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button disabled variant="outline">
              <Cloud className="mr-2 h-4 w-4" />
              Google Drive
            </Button>
            <Button disabled variant="outline">
              <Cloud className="mr-2 h-4 w-4" />
              Dropbox
            </Button>
            <Button disabled variant="outline">
              <Cloud className="mr-2 h-4 w-4" />
              OneDrive
            </Button>
            <Button disabled variant="outline">
              <HardDrive className="mr-2 h-4 w-4" />
              iCloud
            </Button>
          </div>
        </div>
      </SettingSection>

      {/* Storage */}
      <SettingSection
        description="Manage storage and cache"
        icon={HardDrive}
        title="Storage"
      >
        <div className="space-y-4">
          <Button
            className="w-full justify-between border border-border bg-card px-4 py-3 text-left hover:border-border/80 hover:bg-card/80"
            type="button"
            variant="outline"
          >
            <div className="flex w-full items-center justify-between">
              <div>
                <div className="font-medium text-sm">Clear Thumbnail Cache</div>
                <div className="mt-1 text-muted-foreground text-xs">
                  Remove cached image thumbnails
                </div>
              </div>
              <Download className="text-muted-foreground" size={18} />
            </div>
          </Button>
          <Button
            className="w-full justify-between border border-border bg-card px-4 py-3 text-left hover:border-border/80 hover:bg-card/80"
            type="button"
            variant="outline"
          >
            <div className="flex w-full items-center justify-between">
              <div>
                <div className="font-medium text-sm">Verify File Integrity</div>
                <div className="mt-1 text-muted-foreground text-xs">
                  Check for corrupted files and verify checksums
                </div>
              </div>
              <Shield className="text-muted-foreground" size={18} />
            </div>
          </Button>
        </div>
      </SettingSection>

      {/* Save Button */}
      <div className="flex gap-2 pt-4">
        <Button
          className="flex-1 px-6 py-4 font-semibold"
          size="lg"
          type="button"
        >
          Save Settings
        </Button>
        <Button className="px-6 py-4" size="lg" type="button" variant="outline">
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
