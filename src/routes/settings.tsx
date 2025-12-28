import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "~/components/error-boundary";
import SettingsPanel from "~/components/settings-panel";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  beforeLoad: () => ({
    meta: {
      title: "Settings | ohmyfs",
    },
  }),
});

function SettingsPage() {
  return (
    <ErrorBoundary>
      <SettingsPanel />
    </ErrorBoundary>
  );
}
