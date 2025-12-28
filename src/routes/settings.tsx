import { createFileRoute } from "@tanstack/react-router";
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
    <div className="container mx-auto h-full max-h-screen overflow-y-auto px-4 py-8">
      <SettingsPanel />
    </div>
  );
}
