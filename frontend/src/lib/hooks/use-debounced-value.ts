import { useEffect, useState } from "react";

/**
 * Debounces a rapidly-changing value (typically search input) so dependent
 * network requests don't fire on every keystroke. Use for server-backed
 * search; client-side array filtering doesn't need this at all.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
