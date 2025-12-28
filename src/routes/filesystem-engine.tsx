import { createFileRoute } from "@tanstack/react-router";
import { FileSystemEngineManager } from "~/components/filesystem-engine/filesystem-engine-manager";

export const Route = createFileRoute("/filesystem-engine")({
  component: FileSystemEnginePage,
});

function FileSystemEnginePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FileSystemEngineManager />
    </div>
  );
}
