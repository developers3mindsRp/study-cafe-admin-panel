import { useCallback, useState } from "react";
import type { FilterValues } from "./filter.types";

export interface UseFilterStateReturn {
  values: FilterValues;
  /** Set one field, or pass a record to update min/max (etc.) in one state commit. */
  set: (id: string, value: string) => void;
  setMany: (updates: Record<string, string>) => void;
  reset: () => void;
  hasActive: boolean;
}

export function useFilterState(initial: FilterValues = {}): UseFilterStateReturn {
  const [values, setValues] = useState<FilterValues>(initial);

  const set = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setMany = useCallback((updates: Record<string, string>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActive = Object.values(values).some(Boolean);

  return { values, set, setMany, reset, hasActive };
}
