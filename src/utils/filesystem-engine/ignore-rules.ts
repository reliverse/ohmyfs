/**
 * Ignore rules implementation similar to .gitignore patterns
 */

export interface IgnoreRule {
  pattern: string;
  negated: boolean;
  regex: RegExp;
}

/**
 * Compile ignore patterns into regex rules
 */
export function compileIgnorePatterns(patterns: string[]): IgnoreRule[] {
  return patterns
    .map((pattern) => {
      const trimmed = pattern.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        return null;
      }

      const negated = trimmed.startsWith("!");
      const actualPattern = negated ? trimmed.slice(1) : trimmed;

      // Convert glob pattern to regex
      const regex = globToRegex(actualPattern);

      return {
        pattern: actualPattern,
        negated,
        regex,
      };
    })
    .filter((rule): rule is IgnoreRule => rule !== null);
}

/**
 * Convert a glob pattern to a regex
 */
function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except * and ?
  let regex = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");

  // Convert glob patterns
  regex = regex
    .replace(/\*\*/g, ".*") // ** matches any number of path segments
    .replace(/\*/g, "[^/]*") // * matches any characters except /
    .replace(/\?/g, "[^/]"); // ? matches any single character except /

  // Handle directory patterns (ending with /)
  if (pattern.endsWith("/")) {
    regex = `^${regex}.*`;
  } else {
    regex = `^${regex}$`;
  }

  return new RegExp(regex);
}

/**
 * Check if a path should be ignored based on the rules
 */
export function shouldIgnorePath(path: string, rules: IgnoreRule[]): boolean {
  // .gitignore rules are processed in order
  // Later rules can override earlier ones

  for (const rule of rules) {
    if (rule.regex.test(path)) {
      return !rule.negated; // If negated, we DON'T ignore (include)
    }
  }

  return false; // Default: don't ignore
}

/**
 * Filter entries based on ignore patterns
 */
export function filterIgnoredEntries<T extends { path: string }>(
  entries: T[],
  ignorePatterns: string[]
): T[] {
  if (ignorePatterns.length === 0) {
    return entries;
  }

  const rules = compileIgnorePatterns(ignorePatterns);
  return entries.filter((entry) => !shouldIgnorePath(entry.path, rules));
}

/**
 * Common ignore patterns for different project types
 */
export const COMMON_IGNORE_PATTERNS = {
  node: [
    "node_modules/",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".npm",
    ".yarn/",
    ".env",
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local",
    "dist/",
    "build/",
    ".next/",
    ".nuxt/",
    ".cache/",
  ],
  rust: ["target/", "Cargo.lock", "**/*.rs.bk", ".cargo/"],
  python: [
    "__pycache__/",
    "*.py[cod]",
    "*py.class",
    "*.so",
    ".Python",
    "build/",
    "develop-eggs/",
    "dist/",
    "downloads/",
    "eggs/",
    ".eggs/",
    "lib/",
    "lib64/",
    "parts/",
    "sdist/",
    "var/",
    "wheels/",
    "*.egg-info/",
    ".installed.cfg",
    "*.egg",
    "MANIFEST",
  ],
  general: [
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    "*.tmp",
    "*.temp",
    "*.log",
    ".git/",
    ".svn/",
    ".hg/",
  ],
};

/**
 * Get ignore patterns for a project type
 */
export function getIgnorePatternsForType(
  type: "node" | "rust" | "python" | "general"
): string[] {
  return COMMON_IGNORE_PATTERNS[type] || [];
}

/**
 * Merge multiple ignore pattern arrays
 */
export function mergeIgnorePatterns(...patternArrays: string[][]): string[] {
  const merged = new Set<string>();
  for (const patterns of patternArrays) {
    for (const pattern of patterns) {
      merged.add(pattern);
    }
  }
  return Array.from(merged);
}
