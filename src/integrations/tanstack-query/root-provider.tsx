import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Singleton QueryClient instance to prevent memory leaks during HMR
let queryClientInstance: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          // Prevent refetching on window focus in development
          refetchOnWindowFocus: false,
          // Reduce stale time to prevent excessive caching
          staleTime: 1000 * 60 * 5, // 5 minutes
          // Garbage collect after 10 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        },
      },
    });
  }
  return queryClientInstance;
}

export function getContext() {
  const queryClient = getQueryClient();
  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
