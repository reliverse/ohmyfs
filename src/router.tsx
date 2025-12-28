import { createRouter } from "@tanstack/react-router";
import { AuthProvider } from "./contexts/auth-context";
import { FileManagerProvider } from "./contexts/file-manager-context";
// biome-ignore lint/performance/noNamespaceImport: intentional namespace import for TanstackQuery
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
import { routeTree } from "./routeTree.gen";

let routerInstance: ReturnType<typeof createRouter> | undefined;
export const getRouter = () => {
  if (routerInstance) {
    return routerInstance;
  }

  const rqContext = TanstackQuery.getContext();

  routerInstance = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          <AuthProvider>
            <FileManagerProvider>{props.children}</FileManagerProvider>
          </AuthProvider>
        </TanstackQuery.Provider>
      );
    },
  });

  return routerInstance;
};
