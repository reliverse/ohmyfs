import { Toaster as SonnerToaster } from "sonner";

/**
 * Toast notification provider component.
 * Wraps the Sonner Toaster component with app-specific configuration.
 *
 * Add this component to your root layout to enable toast notifications throughout the app.
 *
 * @example
 * ```tsx
 * // In __root.tsx
 * import { ToasterProvider } from "~/components/toaster";
 *
 * function RootComponent() {
 *   return (
 *     <>
 *       <Outlet />
 *       <ToasterProvider />
 *     </>
 *   );
 * }
 * ```
 */
export function ToasterProvider() {
  return (
    <SonnerToaster
      closeButton
      duration={4000}
      position="top-right"
      richColors
      toastOptions={{
        className: "font-sans",
      }}
    />
  );
}
