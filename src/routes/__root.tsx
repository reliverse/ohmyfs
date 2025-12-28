import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { MainLayout } from "~/components/main-layout";
import { ToasterProvider } from "~/components/toaster";

// import { TanStackDevtools } from "@tanstack/react-devtools";
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
// import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});

// Simplified component for Tauri/Vite setup (no SSR)
function RootComponent() {
  const location = useLocation();
  // Only show devtools in development to prevent performance issues
  // const isDevelopment = import.meta.env.DEV;

  // Hide sidebar for specific routes
  const hideSidebarRoutes = [
    "/filesystem-engine",
    "/settings",
    "/auth",
    "/account",
  ];
  const showSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <MainLayout showSidebar={showSidebar}>
        <Outlet />
      </MainLayout>
      <ToasterProvider />
      {/* {isDevelopment && (
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
      )} */}
    </div>
  );
}
