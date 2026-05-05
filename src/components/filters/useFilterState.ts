import { useCallback, useState } from "react";
import type { FilterValues } from "./filter.types";

export interface UseFilterStateReturn {
  values: FilterValues;
  set: (id: string, value: string) => void;
  reset: () => void;
  hasActive: boolean;
}

export function useFilterState(initial: FilterValues = {}): UseFilterStateReturn {
  const [values, setValues] = useState<FilterValues>(initial);

  const set = useCallback((id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActive = Object.values(values).some(Boolean);

  return { values, set, reset, hasActive };
}
