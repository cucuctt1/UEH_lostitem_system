import { useEffect, useRef } from "react";

export function usePolling(callback: () => Promise<void> | void, intervalMs: number, active = true): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setInterval(() => {
      void callbackRef.current();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, active]);
}
