import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
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
  // Only show devtools in development to prevent performance issues
  // const isDevelopment = import.meta.env.DEV;

  return (
    <>
      <Outlet />
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
    </>
  );
}
