import { createFileRoute } from "@tanstack/react-router";
import { FileSystemEngineManager } from "~/components/filesystem-engine/filesystem-engine-manager";
import type { FileStructureDefinition } from "~/types/filesystem-engine";

export const Route = createFileRoute("/filesystem-engine")({
  component: FileSystemEnginePage,
  validateSearch: (search: Record<string, unknown>) => ({
    definition: (typeof search.definition === "string"
      ? JSON.parse(search.definition)
      : undefined) as FileStructureDefinition | undefined,
    path: typeof search.path === "string" ? search.path : undefined,
  }),
});

function FileSystemEnginePage() {
  const { definition: importedDefinition, path: initialPath } =
    Route.useSearch();

  return (
    <div className="container mx-auto h-full max-h-screen overflow-y-auto px-4 py-8">
      <FileSystemEngineManager
        basePath={initialPath}
        initialDefinition={importedDefinition}
      />
    </div>
  );
}
