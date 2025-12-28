import { useCallback, useEffect, useRef, useState } from "react";

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string, enabled = true) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    renderCount.current += 1;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;

    renderTimes.current.push(renderTime);
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }

    lastRenderTime.current = now;

    // Log performance metrics every 10 renders
    if (renderCount.current % 10 === 0) {
      const avgRenderTime =
        renderTimes.current.reduce((a, b) => a + b, 0) /
        renderTimes.current.length;
      console.log(`${componentName} performance:`, {
        renders: renderCount.current,
        avgRenderTime: `${avgRenderTime.toFixed(2)}ms`,
        lastRenderTime: `${renderTime}ms`,
      });
    }
  });

  return {
    renderCount: renderCount.current,
    averageRenderTime:
      renderTimes.current.length > 0
        ? renderTimes.current.reduce((a, b) => a + b, 0) /
          renderTimes.current.length
        : 0,
  };
}

// Memory usage monitoring
export function useMemoryMonitor(enabled = true) {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  const updateMemoryInfo = useCallback(() => {
    if (!(enabled && "memory" in performance && performance.memory)) {
      return;
    }

    const mem = (
      performance as {
        memory: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;
    setMemoryInfo({
      used: Math.round(mem.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(mem.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024), // MB
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enabled, updateMemoryInfo]);

  return memoryInfo;
}

// Debounced search hook for better performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        return callback(...args);
      }
    },
    [callback, delay]
  ) as T;
}

// Lazy loading hook for components
export function useLazyLoad(ref: React.RefObject<Element>, threshold = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, threshold]);

  return isIntersecting;
}

// Cache hook for expensive computations
export function useMemoCache<T>(
  factory: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T {
  const cache = useRef<Map<string, { value: T; deps: React.DependencyList }>>(
    new Map()
  );

  const depsKey = JSON.stringify(deps);
  const key = cacheKey || depsKey;

  const cached = cache.current.get(key);
  if (cached && JSON.stringify(cached.deps) === depsKey) {
    return cached.value;
  }

  const value = factory();
  cache.current.set(key, { value, deps });

  // Limit cache size
  if (cache.current.size > 50) {
    const firstKey = cache.current.keys().next().value;
    if (firstKey) {
      cache.current.delete(firstKey);
    }
  }

  return value;
}

// Performance-optimized file operations batching
export function useBatchOperations() {
  const operations = useRef<
    Map<
      string,
      {
        fn: () => Promise<unknown>;
        resolve: (value: unknown) => void;
        reject: (error: unknown) => void;
      }
    >
  >(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  const processOperations = useCallback(async () => {
    if (isProcessing || operations.current.size === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Process operations in batches of 3
      const batchSize = 3;
      const entries = Array.from(operations.current.entries());

      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async ([id, { fn, resolve, reject }]) => {
            try {
              const result = await fn();
              resolve(result);
            } catch (error) {
              reject(error);
            } finally {
              operations.current.delete(id);
            }
          })
        );

        // Small delay between batches to prevent UI blocking
        if (i + batchSize < entries.length) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const addOperation = useCallback(
    (id: string, operation: () => Promise<unknown>): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        operations.current.set(id, { fn: operation, resolve, reject });

        // Start processing if not already running
        if (!isProcessing) {
          processOperations();
        }
      });
    },
    [isProcessing, processOperations]
  );

  return {
    addOperation,
    isProcessing,
    queueSize: operations.current.size,
  };
}
