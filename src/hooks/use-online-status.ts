import { useEffect, useState } from "react";

/**
 * Custom hook to track online/offline status.
 * Useful for showing offline indicators and handling offline scenarios.
 *
 * @returns `true` if the device is online, `false` otherwise
 *
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 *
 * {!isOnline && (
 *   <div className="offline-indicator">
 *     You're currently offline
 *   </div>
 * )}
 * ```
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
