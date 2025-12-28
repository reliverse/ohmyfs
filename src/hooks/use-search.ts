import Fuse from "fuse.js";
import { useMemo, useState } from "react";
import type { FileEntry, SearchFilters, SearchResult } from "~/types/file";
import { readDirectory } from "~/utils/file-system";

interface UseSearchOptions {
  enabled?: boolean;
  maxResults?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { enabled = true, maxResults = 1000 } = options;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const searchResult = useMemo((): SearchResult | undefined => {
    if (!(enabled && query.trim())) {
      return undefined;
    }

    setIsSearching(true);
    setError(undefined);

    const performSearch = async (): Promise<SearchResult> => {
      try {
        // For now, search in current directory and subdirectories
        // TODO: Expand to search entire filesystem or specific paths
        const searchPath = filters.path || "/home"; // Default to home directory

        const allFiles: FileEntry[] = [];

        const applyTypeFilter = (files: FileEntry[]): FileEntry[] => {
          if (!filters.type || filters.type.length === 0) {
            return files;
          }

          return files.filter((file) => {
            if (filters.type?.includes("folder")) {
              return file.isDirectory;
            }
            return (
              !file.isDirectory &&
              filters.type?.some((type) => {
                if (type === "folder") {
                  return false;
                }
                return (
                  file.extension === type ||
                  file.mimeType?.includes(type.replace(".", "/"))
                );
              })
            );
          });
        };

        const applySizeFilter = (files: FileEntry[]): FileEntry[] => {
          if (!filters.size) {
            return files;
          }

          return files.filter((file) => {
            if (!file.size) {
              return false;
            }
            const size = file.size;
            const { min, max } = filters.size || {};
            return (
              (min === undefined || size >= min) &&
              (max === undefined || size <= max)
            );
          });
        };

        const applyDateFilter = (files: FileEntry[]): FileEntry[] => {
          if (!filters.modified) {
            return files;
          }

          return files.filter((file) => {
            if (!file.modifiedAt) {
              return false;
            }
            const modDate = file.modifiedAt;
            const { from, to } = filters.modified || {};
            return (
              (from === undefined || modDate >= from) &&
              (to === undefined || modDate <= to)
            );
          });
        };

        const shouldRecurseIntoDirectory = (
          path: string,
          file: FileEntry
        ): boolean => {
          return (
            file.isDirectory &&
            file.name !== "." &&
            file.name !== ".." &&
            path.split("/").length < searchPath.split("/").length + 3
          );
        };

        const processDirectoryFiles = (files: FileEntry[]): FileEntry[] => {
          let filteredFiles = files;
          filteredFiles = applyTypeFilter(filteredFiles);
          filteredFiles = applySizeFilter(filteredFiles);
          filteredFiles = applyDateFilter(filteredFiles);
          return filteredFiles;
        };

        const searchRecursive = async (path: string): Promise<void> => {
          try {
            const files = await readDirectory(path, filters.includeHidden);
            const filteredFiles = processDirectoryFiles(files);

            allFiles.push(...filteredFiles);

            // Recursively search subdirectories
            for (const file of files) {
              if (shouldRecurseIntoDirectory(path, file)) {
                await searchRecursive(file.path);
              }
            }
          } catch (err) {
            // Ignore permission errors, etc.
            console.warn("Error searching directory:", path, err);
          }
        };

        await searchRecursive(searchPath);

        // Set up Fuse.js for fuzzy search
        const fuseOptions = {
          keys: [
            { name: "name", weight: 0.7 },
            { name: "extension", weight: 0.2 },
            { name: "path", weight: 0.1 },
          ],
          threshold: 0.3, // More lenient matching
          includeScore: true,
          includeMatches: true,
        };

        const fuse = new Fuse(allFiles, fuseOptions);
        const fuseResults = fuse.search(query.trim());

        const results = fuseResults
          .slice(0, maxResults)
          .map((result) => result.item);

        return {
          items: results,
          totalCount: results.length,
          query: query.trim(),
          filters,
          isLoading: false,
        };
      } catch (err) {
        throw new Error(
          `Search failed: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    };

    performSearch()
      .then((result) => {
        setIsSearching(false);
        return result;
      })
      .catch((err) => {
        setError(err.message);
        setIsSearching(false);
      });

    return {
      items: [],
      totalCount: 0,
      query: query.trim(),
      filters,
      isLoading: true,
    };
  }, [query, filters, enabled, maxResults]);

  const updateQuery = (newQuery: string) => {
    setQuery(newQuery);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearSearch = () => {
    setQuery("");
    setFilters({});
    setError(undefined);
  };

  return {
    searchResult,
    isSearching,
    error,
    updateQuery,
    updateFilters,
    clearSearch,
    hasActiveFilters: Object.keys(filters).length > 0,
  };
}
