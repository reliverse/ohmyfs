import {
  Archive,
  FileText,
  Filter,
  Folder,
  Image,
  Loader2,
  Music,
  Search,
  Video,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useFileManagerActions } from "~/contexts/file-manager-context";
import { useSearch } from "~/hooks/use-search";
import type { FileEntry, SearchFilters, SearchResult } from "~/types/file";
import { formatDate, formatFileSize } from "~/utils/file-system";

// Extract filter logic to reduce component complexity
const SIZE_RANGES = {
  small: { min: 0, max: 1024 * 1024 }, // < 1MB
  medium: { min: 1024 * 1024, max: 100 * 1024 * 1024 }, // 1MB - 100MB
  large: { min: 100 * 1024 * 1024, max: undefined }, // > 100MB
};

const DATE_RANGES = {
  today: (now: Date) => ({
    from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  }),
  week: (now: Date) => ({
    from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
  }),
  month: (now: Date) => ({
    from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  }),
  year: (now: Date) => ({
    from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
  }),
};

interface SearchPanelProps {
  onClose: () => void;
}

const FILE_TYPE_FILTERS = [
  {
    label: "Documents",
    icon: FileText,
    types: [".txt", ".doc", ".docx", ".pdf", ".rtf"],
  },
  { label: "Folders", icon: Folder, types: ["folder"] },
  {
    label: "Images",
    icon: Image,
    types: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"],
  },
  {
    label: "Videos",
    icon: Video,
    types: [".mp4", ".avi", ".mov", ".wmv", ".mkv", ".webm"],
  },
  {
    label: "Music",
    icon: Music,
    types: [".mp3", ".wav", ".flac", ".aac", ".ogg"],
  },
  {
    label: "Archives",
    icon: Archive,
    types: [".zip", ".rar", ".7z", ".tar", ".gz"],
  },
];

// Helper functions to reduce component complexity
const getSizeFilterValue = (value: "any" | "small" | "medium" | "large") => {
  return value !== "any" ? SIZE_RANGES[value] : undefined;
};

const getDateFilterValue = (
  value: "any" | "today" | "week" | "month" | "year"
) => {
  if (value === "any") {
    return undefined;
  }
  const now = new Date();
  return DATE_RANGES[value](now);
};

const toggleFileType = (currentTypes: string[], types: string[]): string[] => {
  const newTypes = [...currentTypes];
  for (const type of types) {
    const index = newTypes.indexOf(type);
    if (index >= 0) {
      newTypes.splice(index, 1);
    } else {
      newTypes.push(type);
    }
  }
  return newTypes;
};

// Extract Advanced Filters component to reduce main component complexity
interface AdvancedFiltersProps {
  sizeFilter: "any" | "small" | "medium" | "large";
  dateFilter: "any" | "today" | "week" | "month" | "year";
  onSizeFilterChange: (
    value: "any" | "small" | "medium" | "large" | null
  ) => void;
  onDateFilterChange: (
    value: "any" | "today" | "week" | "month" | "year" | null
  ) => void;
}

const AdvancedFilters = ({
  sizeFilter,
  dateFilter,
  onSizeFilterChange,
  onDateFilterChange,
}: AdvancedFiltersProps) => (
  <CollapsibleContent className="mt-4 space-y-4 rounded-lg border bg-muted/30 p-4">
    {/* Size Filter */}
    <div className="space-y-2">
      <label className="font-medium text-sm" htmlFor="file-size-filter">
        File size
      </label>
      <Select onValueChange={onSizeFilterChange} value={sizeFilter}>
        <SelectTrigger id="file-size-filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any size</SelectItem>
          <SelectItem value="small">Small (&lt; 1MB)</SelectItem>
          <SelectItem value="medium">Medium (1MB - 100MB)</SelectItem>
          <SelectItem value="large">Large (&gt; 100MB)</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Date Filter */}
    <div className="space-y-2">
      <label className="font-medium text-sm" htmlFor="date-filter">
        Modified date
      </label>
      <Select onValueChange={onDateFilterChange} value={dateFilter}>
        <SelectTrigger id="date-filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any date</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This week</SelectItem>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="year">This year</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Additional Options */}
    <div className="space-y-2">
      <span className="font-medium text-sm">Options</span>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="case-sensitive" />
          <label className="text-sm" htmlFor="case-sensitive">
            Case sensitive
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="regex" />
          <label className="text-sm" htmlFor="regex">
            Use regular expressions
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="whole-words" />
          <label className="text-sm" htmlFor="whole-words">
            Match whole words only
          </label>
        </div>
      </div>
    </div>
  </CollapsibleContent>
);

// Extract Search Results component
interface SearchResultsProps {
  searchResult: SearchResult;
  onFileClick: (file: FileEntry) => void;
}

const SearchResults = ({ searchResult, onFileClick }: SearchResultsProps) => (
  <div className="border-t pt-4">
    <ScrollArea className="h-64">
      <div className="space-y-1">
        {searchResult.items.map((file: FileEntry, index: number) => (
          <button
            className="flex w-full cursor-pointer items-center gap-3 rounded p-2 text-left hover:bg-accent"
            key={`${file.path}-${index}`}
            onClick={() => onFileClick(file)}
            type="button"
          >
            {file.isDirectory ? (
              <Folder className="h-4 w-4 shrink-0 text-blue-500" />
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium" title={file.name}>
                  {file.name}
                </span>
                {file.extension && (
                  <Badge className="text-xs" variant="outline">
                    {file.extension}
                  </Badge>
                )}
              </div>
              <div
                className="truncate text-muted-foreground text-xs"
                title={file.path}
              >
                {file.path}
              </div>
            </div>
            <div className="shrink-0 text-muted-foreground text-xs">
              {file.size ? formatFileSize(file.size) : ""}
              {file.modifiedAt && (
                <>
                  {file.size && " • "}
                  {formatDate(file.modifiedAt)}
                </>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  </div>
);

// Extract No Results component
interface NoResultsProps {
  query: string;
  hasActiveFilters: boolean;
}

const NoResults = ({ query, hasActiveFilters }: NoResultsProps) => (
  <div className="py-8 text-center text-muted-foreground">
    <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
    <p>No files found matching "{query}"</p>
    {hasActiveFilters && (
      <p className="mt-1 text-sm">Try adjusting your filters</p>
    )}
  </div>
);

// Custom hook to manage search panel filters
const useSearchPanelFilters = (
  updateFilters: (filters: Partial<SearchFilters>) => void
) => {
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [sizeFilter, setSizeFilter] = useState<
    "any" | "small" | "medium" | "large"
  >("any");
  const [dateFilter, setDateFilter] = useState<
    "any" | "today" | "week" | "month" | "year"
  >("any");

  const handleFileTypeToggle = useCallback(
    (types: string[]) => {
      const newTypes = toggleFileType(fileTypes, types);
      setFileTypes(newTypes);
      updateFilters({
        type: newTypes.length > 0 ? newTypes : undefined,
      });
    },
    [fileTypes, updateFilters]
  );

  const handleSizeFilterChange = useCallback(
    (value: "any" | "small" | "medium" | "large" | null) => {
      if (value) {
        setSizeFilter(value);
        updateFilters({
          size: getSizeFilterValue(value),
        });
      }
    },
    [updateFilters]
  );

  const handleDateFilterChange = useCallback(
    (value: "any" | "today" | "week" | "month" | "year" | null) => {
      if (value) {
        setDateFilter(value);
        updateFilters({
          modified: getDateFilterValue(value),
        });
      }
    },
    [updateFilters]
  );

  const clearFilters = useCallback(() => {
    setFileTypes([]);
    setSizeFilter("any");
    setDateFilter("any");
    updateFilters({});
  }, [updateFilters]);

  const hasActiveFilters =
    fileTypes.length > 0 || sizeFilter !== "any" || dateFilter !== "any";

  return {
    fileTypes,
    sizeFilter,
    dateFilter,
    hasActiveFilters,
    handleFileTypeToggle,
    handleSizeFilterChange,
    handleDateFilterChange,
    clearFilters,
  };
};

export function SearchPanel({ onClose }: SearchPanelProps) {
  const [searchPath, setSearchPath] = useState("current");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    searchResult,
    isSearching,
    error,
    updateQuery,
    updateFilters,
    clearSearch,
  } = useSearch({
    enabled: true,
    maxResults: 100,
  });

  const { setCurrentPath } = useFileManagerActions();

  const {
    fileTypes,
    sizeFilter,
    dateFilter,
    hasActiveFilters,
    handleFileTypeToggle,
    handleSizeFilterChange,
    handleDateFilterChange,
    clearFilters,
  } = useSearchPanelFilters(updateFilters);

  const handleSearch = useCallback(
    (newQuery: string) => {
      updateQuery(newQuery);
    },
    [updateQuery]
  );

  const handleFileClick = useCallback(
    (file: FileEntry) => {
      setCurrentPath(file.path);
      onClose();
    },
    [setCurrentPath, onClose]
  );

  <CollapsibleContent className="mt-4 space-y-4 rounded-lg border bg-muted/30 p-4">
    {/* Size Filter */}
    <div className="space-y-2">
      <label className="font-medium text-sm" htmlFor="file-size-filter">
        File size
      </label>
      <Select onValueChange={handleSizeFilterChange} value={sizeFilter}>
        <SelectTrigger id="file-size-filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any size</SelectItem>
          <SelectItem value="small">Small (&lt; 1MB)</SelectItem>
          <SelectItem value="medium">Medium (1MB - 100MB)</SelectItem>
          <SelectItem value="large">Large (&gt; 100MB)</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Date Filter */}
    <div className="space-y-2">
      <label className="font-medium text-sm" htmlFor="date-filter">
        Modified date
      </label>
      <Select onValueChange={handleDateFilterChange} value={dateFilter}>
        <SelectTrigger id="date-filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any date</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This week</SelectItem>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="year">This year</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Additional Options */}
    <div className="space-y-2">
      <span className="font-medium text-sm">Options</span>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="case-sensitive" />
          <label className="text-sm" htmlFor="case-sensitive">
            Case sensitive
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="regex" />
          <label className="text-sm" htmlFor="regex">
            Use regular expressions
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="whole-words" />
          <label className="text-sm" htmlFor="whole-words">
            Match whole words only
          </label>
        </div>
      </div>
    </div>
  </CollapsibleContent>;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            className="pr-9 pl-9"
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search files and folders..."
            value={searchResult?.query || ""}
          />
          {searchResult?.query && (
            <Button
              className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 transform p-0"
              onClick={clearSearch}
              size="sm"
              variant="ghost"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button onClick={onClose} variant="outline">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Status */}
      {isSearching && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      {error && (
        <div className="rounded bg-destructive/10 p-2 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Results Count */}
      {searchResult && !isSearching && !error && (
        <div className="text-muted-foreground text-sm">
          Found {searchResult.totalCount} result
          {searchResult.totalCount !== 1 ? "s" : ""}
          {searchResult.totalCount > searchResult.items.length &&
            ` (showing first ${searchResult.items.length})`}
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          onValueChange={(value) => value && setSearchPath(value)}
          value={searchPath}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current folder</SelectItem>
            <SelectItem value="subfolders">Current + subfolders</SelectItem>
            <SelectItem value="all">All folders</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button onClick={clearFilters} size="sm" variant="outline">
            Clear filters
          </Button>
        )}
      </div>

      {/* File Type Filters */}
      <div className="flex flex-wrap gap-2">
        {FILE_TYPE_FILTERS.map(({ label, icon: Icon, types }) => {
          const isActive = types.some((type) => fileTypes.includes(type));
          return (
            <Button
              className="gap-1"
              key={label}
              onClick={() => handleFileTypeToggle(types)}
              size="sm"
              variant={isActive ? "default" : "outline"}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          );
        })}
      </div>

      {/* Advanced Filters */}
      <Collapsible onOpenChange={setShowAdvanced} open={showAdvanced}>
        <CollapsibleTrigger>
          <Button className="gap-1" size="sm" variant="ghost">
            <Filter className="h-3 w-3" />
            Advanced filters
          </Button>
        </CollapsibleTrigger>
        <AdvancedFilters
          dateFilter={dateFilter}
          onDateFilterChange={handleDateFilterChange}
          onSizeFilterChange={handleSizeFilterChange}
          sizeFilter={sizeFilter}
        />
      </Collapsible>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {fileTypes.length > 0 && (
            <Badge variant="secondary">
              {fileTypes.length} file type{fileTypes.length > 1 ? "s" : ""}{" "}
              selected
            </Badge>
          )}
          {sizeFilter !== "any" && (
            <Badge variant="secondary">Size: {sizeFilter}</Badge>
          )}
          {dateFilter !== "any" && (
            <Badge variant="secondary">Date: {dateFilter}</Badge>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResult && searchResult.items.length > 0 && (
        <SearchResults
          onFileClick={handleFileClick}
          searchResult={searchResult}
        />
      )}

      {/* No Results */}
      {searchResult &&
        searchResult.items.length === 0 &&
        !isSearching &&
        !error &&
        searchResult.query && (
          <NoResults
            hasActiveFilters={hasActiveFilters}
            query={searchResult.query}
          />
        )}
    </div>
  );
}
