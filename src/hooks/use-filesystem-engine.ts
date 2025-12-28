import { useCallback, useState } from "react";
import { useToast } from "~/hooks/use-toast";
import type {
  FileEntry,
  FileStructureDefinition,
  VariableValues,
} from "~/types/filesystem-engine";
import { FileSystemEngine } from "~/utils/filesystem-engine/engine";
import { logger } from "~/utils/logger";

// Common structure templates
export const STRUCTURE_TEMPLATES: Record<string, FileStructureDefinition> = {
  "react-app": {
    name: "React App",
    description: "Basic React application structure",
    version: "1.0.0",
    basePath: ".",
    variables: [
      {
        name: "projectName",
        type: "string",
        defaultValue: "my-react-app",
        description: "Name of the React project",
      },
    ],
    structure: [
      {
        type: "directory",
        name: "{{projectName}}",
        children: [
          {
            type: "file",
            name: "package.json",
            content: {
              content: `{
  "name": "{{projectName}}",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}`,
              encoding: "utf8",
            },
          },
          {
            type: "file",
            name: "public/index.html",
            content: {
              content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{{projectName}}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
              encoding: "utf8",
            },
          },
          {
            type: "file",
            name: "src/index.js",
            content: {
              content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
              encoding: "utf8",
            },
          },
          {
            type: "file",
            name: "src/App.js",
            content: {
              content: `function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to {{projectName}}</h1>
      </header>
    </div>
  );
}

export default App;`,
              encoding: "utf8",
            },
          },
          {
            type: "file",
            name: "src/index.css",
            content: {
              content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
              encoding: "utf8",
            },
          },
        ],
      },
    ],
  },

  "node-package": {
    name: "Node.js Package",
    description: "Basic Node.js package structure",
    version: "1.0.0",
    basePath: ".",
    variables: [
      {
        name: "packageName",
        type: "string",
        defaultValue: "my-node-package",
        description: "Name of the npm package",
      },
      {
        name: "author",
        type: "string",
        defaultValue: "Your Name",
        description: "Package author",
      },
    ],
    structure: [
      {
        type: "directory",
        name: "{{packageName}}",
        children: [
          {
            type: "file",
            name: "package.json",
            content: {
              content: `{
  "name": "{{packageName}}",
  "version": "1.0.0",
  "description": "A Node.js package",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "author": "{{author}}",
  "license": "ISC"
}`,
              encoding: "utf8",
            },
          },
          {
            type: "file",
            name: "index.js",
            content: {
              content: `// {{packageName}}
// Main entry point

module.exports = {
  // Add your package exports here
};`,
              encoding: "utf8",
            },
          },
          {
            type: "file",
            name: "README.md",
            content: {
              content: `# {{packageName}}

A Node.js package.

## Installation

\`\`\`bash
npm install {{packageName}}
\`\`\`

## Usage

\`\`\`javascript
const {{packageName}} = require('{{packageName}}');

// Use the package
\`\`\``,
              encoding: "utf8",
            },
          },
        ],
      },
    ],
  },

  "web-project": {
    name: "Web Project",
    description: "Basic web project with HTML, CSS, and JS",
    version: "1.0.0",
    basePath: ".",
    variables: [
      {
        name: "projectName",
        type: "string",
        defaultValue: "my-web-project",
        description: "Name of the web project",
      },
    ],
    structure: [
      {
        type: "directory",
        name: "{{projectName}}",
        children: [
          {
            type: "file",
            name: "index.html",
            content: {
              content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectName}}</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to {{projectName}}</h1>
        <p>This is a basic web project structure.</p>
    </div>
    <script src="js/script.js"></script>
</body>
</html>`,
              encoding: "utf8",
            },
          },
          {
            type: "file",
            name: "css/style.css",
            content: {
              content: `/* {{projectName}} Styles */

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
}`,
              encoding: "utf8",
            },
          },
          {
            type: "file",
            name: "js/script.js",
            content: {
              content: `// {{projectName}} JavaScript

console.log('{{projectName}} loaded successfully!');

// Add your JavaScript code here`,
              encoding: "utf8",
            },
          },
        ],
      },
    ],
  },
};

export function useStructureTemplates() {
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);

  // Helper function to resolve directory name conflicts
  const resolveDirectoryNameConflict = useCallback(
    (
      definition: FileStructureDefinition,
      resolvedVariables: VariableValues,
      actualEntries: FileEntry[]
    ): VariableValues => {
      const targetDirName = definition.structure[0]?.name;
      if (!targetDirName) {
        return resolvedVariables;
      }

      const resolvedTargetName = targetDirName.replace(
        /\{\{(\w+)\}\}/g,
        (match, varName) => {
          const value = resolvedVariables[varName];
          return typeof value === "string" ? value : String(value ?? match);
        }
      );

      let finalTargetName = resolvedTargetName;
      let counter = 2;

      // Check if directory with this name already exists
      while (
        actualEntries.some(
          (entry) => entry.name === finalTargetName && entry.isDirectory
        )
      ) {
        finalTargetName = `${resolvedTargetName} (${counter})`;
        counter++;
      }

      // Update the variable if we had to change the name
      if (finalTargetName !== resolvedTargetName) {
        const varName = Object.keys(resolvedVariables).find(
          (key) => resolvedVariables[key] === resolvedTargetName.split(" (")[0]
        );
        if (varName) {
          return {
            ...resolvedVariables,
            [varName]: finalTargetName,
          };
        }
      }

      return resolvedVariables;
    },
    []
  );

  const applyTemplate = useCallback(
    async (
      templateId: string,
      basePath: string,
      variables: VariableValues = {}
    ) => {
      console.log(
        `[TEST] applyTemplate called with templateId: ${templateId}, basePath: ${basePath}`
      );
      try {
        setIsApplying(true);
        const template = STRUCTURE_TEMPLATES[templateId];

        if (!template) {
          throw new Error(`Template ${templateId} not found`);
        }

        // Create a copy of the template with the new base path
        const definition: FileStructureDefinition = {
          ...template,
          basePath,
        };

        // Merge provided variables with defaults
        let resolvedVariables: VariableValues = {
          ...Object.fromEntries(
            template.variables.map((v) => [v.name, v.defaultValue])
          ),
          ...variables,
        };

        const engine = new FileSystemEngine({
          verbose: true,
          dryRun: false,
          backup: true,
          force: true, // Force application even if no changes are detected
        });

        // Get actual filesystem entries (for directory conflict resolution only)
        const { readDirectory } = await import("~/utils/file-system");
        logger.debug(
          `Applying template ${templateId} to basePath: ${basePath}`
        );
        const actualEntries = await readDirectory(basePath, true);
        logger.debug(
          `Found ${actualEntries.length} existing entries in ${basePath}`
        );

        // Resolve any directory name conflicts
        resolvedVariables = resolveDirectoryNameConflict(
          definition,
          resolvedVariables,
          actualEntries
        );

        // Apply the template directly without diff validation
        const plan = await engine.apply(
          definition,
          resolvedVariables,
          actualEntries
        );

        toast({
          title: "Template applied successfully",
          description: `Created ${plan.results.filter((r) => r.status === "completed").length} files and directories`,
        });

        return { success: true, plan };
      } catch (error) {
        logger.error("Template application failed:", error);
        toast({
          title: "Template application failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });

        return { success: false, error };
      } finally {
        setIsApplying(false);
      }
    },
    [toast, resolveDirectoryNameConflict]
  );

  const getAvailableTemplates = useCallback(() => {
    return Object.entries(STRUCTURE_TEMPLATES).map(([id, template]) => ({
      id,
      ...template,
    }));
  }, []);

  return {
    templates: STRUCTURE_TEMPLATES,
    applyTemplate,
    getAvailableTemplates,
    isApplying,
  };
}

export function useStructureHistory() {
  const [history, setHistory] = useState<FileStructureDefinition[]>([]);

  const saveToHistory = useCallback((definition: FileStructureDefinition) => {
    setHistory((prev) => {
      const newHistory = [definition, ...prev];
      // Keep only last 10 items
      return newHistory.slice(0, 10);
    });

    // Also save to localStorage
    try {
      const existing = JSON.parse(
        localStorage.getItem("fs-engine-history") || "[]"
      );
      const updated = [definition, ...existing].slice(0, 10);
      localStorage.setItem("fs-engine-history", JSON.stringify(updated));
    } catch (error) {
      logger.warn("Failed to save history to localStorage:", error);
    }
  }, []);

  const loadHistory = useCallback(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("fs-engine-history") || "[]"
      );
      setHistory(stored);
    } catch (error) {
      logger.warn("Failed to load history from localStorage:", error);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("fs-engine-history");
  }, []);

  return {
    history,
    saveToHistory,
    loadHistory,
    clearHistory,
  };
}
